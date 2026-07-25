import { reasoningValueToText } from "./reasoning";

const REASONING_MESSAGE_FIELDS = [
  "reasoning_content",
  "reasoning",
  "reasoning_details",
  "extra_content",
] as const;

type JsonRecord = Record<string, unknown>;
type ProviderReasoningMetadata = Partial<
  Record<(typeof REASONING_MESSAGE_FIELDS)[number], unknown>
>;

interface StreamReasoningState {
  metadata: ProviderReasoningMetadata;
  toolCallIds: Set<string>;
}

function isRecord(value: unknown): value is JsonRecord {
  return typeof value === "object" && value !== null;
}

function getRequestURL(input: RequestInfo | URL): string {
  if (typeof input === "string") return input;
  if (input instanceof URL) return input.toString();
  return input.url;
}

function isChatCompletionsRequest(input: RequestInfo | URL): boolean {
  try {
    return /\/chat\/completions\/?$/.test(new URL(getRequestURL(input)).pathname);
  } catch {
    return false;
  }
}

async function readRequestBody(
  input: RequestInfo | URL,
  init?: RequestInit
): Promise<string | null> {
  if (typeof init?.body === "string") return init.body;
  if (typeof Request !== "undefined" && input instanceof Request) {
    return input.clone().text();
  }
  return null;
}

function readToolCallIds(message: JsonRecord): string[] {
  if (!Array.isArray(message.tool_calls)) return [];
  return message.tool_calls
    .map((toolCall) =>
      isRecord(toolCall) && typeof toolCall.id === "string" ? toolCall.id : ""
    )
    .filter(Boolean);
}

function readReasoningMetadata(
  message: JsonRecord
): ProviderReasoningMetadata | null {
  const metadata: ProviderReasoningMetadata = {};

  for (const field of REASONING_MESSAGE_FIELDS) {
    if (field in message) metadata[field] = message[field];
  }

  return Object.keys(metadata).length > 0 ? metadata : null;
}

function captureReasoningMetadata(
  payload: unknown,
  metadataByToolCall: Map<string, ProviderReasoningMetadata>
): void {
  if (!isRecord(payload) || !Array.isArray(payload.choices)) return;

  for (const choice of payload.choices) {
    if (!isRecord(choice) || !isRecord(choice.message)) continue;
    const metadata = readReasoningMetadata(choice.message);
    if (!metadata) continue;

    for (const toolCallId of readToolCallIds(choice.message)) {
      metadataByToolCall.set(toolCallId, metadata);
    }
  }
}

function mergeReasoningValue(current: unknown, update: unknown): unknown {
  if (typeof current === "string" && typeof update === "string") {
    return current + update;
  }
  if (Array.isArray(current) && Array.isArray(update)) {
    return [...current, ...update];
  }
  return update;
}

function mergeReasoningMetadata(
  current: ProviderReasoningMetadata,
  update: ProviderReasoningMetadata
): ProviderReasoningMetadata {
  const merged = { ...current };
  for (const field of REASONING_MESSAGE_FIELDS) {
    if (field in update) {
      merged[field] = mergeReasoningValue(merged[field], update[field]);
    }
  }
  return merged;
}

function exposeReadableReasoning(payload: unknown): void {
  if (!isRecord(payload) || !Array.isArray(payload.choices)) return;

  for (const choice of payload.choices) {
    if (!isRecord(choice)) continue;
    const message = isRecord(choice.message)
      ? choice.message
      : isRecord(choice.delta)
        ? choice.delta
        : null;
    if (!message || typeof message.reasoning_content === "string") continue;

    const readableReasoning = reasoningValueToText([
      message.reasoning,
      message.reasoning_details,
      message.extra_content,
    ]);
    if (readableReasoning) {
      message.reasoning_content = readableReasoning;
    }
  }
}

function captureStreamReasoningMetadata(
  payload: unknown,
  streamState: Map<number, StreamReasoningState>,
  metadataByToolCall: Map<string, ProviderReasoningMetadata>
): void {
  if (!isRecord(payload) || !Array.isArray(payload.choices)) return;

  for (const choice of payload.choices) {
    if (!isRecord(choice)) continue;
    const index = typeof choice.index === "number" ? choice.index : 0;
    const message = isRecord(choice.delta)
      ? choice.delta
      : isRecord(choice.message)
        ? choice.message
        : null;
    if (!message) continue;

    const current = streamState.get(index) ?? {
      metadata: {},
      toolCallIds: new Set<string>(),
    };
    const metadata = readReasoningMetadata(message);
    if (metadata) {
      current.metadata = mergeReasoningMetadata(current.metadata, metadata);
    }
    for (const toolCallId of readToolCallIds(message)) {
      current.toolCallIds.add(toolCallId);
    }
    streamState.set(index, current);

    if (Object.keys(current.metadata).length > 0) {
      for (const toolCallId of current.toolCallIds) {
        metadataByToolCall.set(toolCallId, { ...current.metadata });
      }
    }
  }
}

function injectReasoningMetadata(
  payload: unknown,
  metadataByToolCall: Map<string, ProviderReasoningMetadata>
): void {
  if (!isRecord(payload) || !Array.isArray(payload.messages)) return;

  for (const message of payload.messages) {
    if (!isRecord(message) || message.role !== "assistant") continue;
    const metadata = readToolCallIds(message)
      .map((toolCallId) => metadataByToolCall.get(toolCallId))
      .find(Boolean);
    if (metadata) Object.assign(message, metadata);
  }
}

function transformEventStream(
  response: Response,
  metadataByToolCall: Map<string, ProviderReasoningMetadata>
): Response {
  if (!response.body || typeof TransformStream === "undefined") return response;

  const decoder = new TextDecoder();
  const encoder = new TextEncoder();
  const streamState = new Map<number, StreamReasoningState>();
  let buffer = "";

  const transformLine = (line: string): string => {
    const match = /^(\s*data:\s*)(.*)$/.exec(line);
    if (!match || match[2] === "[DONE]") return line;

    try {
      const payload = JSON.parse(match[2]);
      captureStreamReasoningMetadata(
        payload,
        streamState,
        metadataByToolCall
      );
      exposeReadableReasoning(payload);
      return `${match[1]}${JSON.stringify(payload)}`;
    } catch {
      return line;
    }
  };

  const stream = response.body.pipeThrough(
    new TransformStream<Uint8Array, Uint8Array>({
      transform(chunk, controller) {
        buffer += decoder.decode(chunk, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";
        for (const line of lines) {
          controller.enqueue(encoder.encode(`${transformLine(line)}\n`));
        }
      },
      flush(controller) {
        buffer += decoder.decode();
        if (buffer) controller.enqueue(encoder.encode(transformLine(buffer)));
      },
    })
  );
  const headers = new Headers(response.headers);
  headers.delete("content-length");
  headers.delete("content-encoding");
  return new Response(stream, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}

export function createReasoningAwareFetch(
  baseFetch: typeof fetch = globalThis.fetch.bind(globalThis)
): typeof fetch {
  const metadataByToolCall = new Map<string, ProviderReasoningMetadata>();

  return (async (input: RequestInfo | URL, init?: RequestInit) => {
    if (!isChatCompletionsRequest(input)) return baseFetch(input, init);

    const rawBody = await readRequestBody(input, init);
    let nextInit = init;

    if (rawBody) {
      try {
        const payload = JSON.parse(rawBody);
        injectReasoningMetadata(payload, metadataByToolCall);
        nextInit = { ...init, body: JSON.stringify(payload) };
      } catch {
        nextInit = init;
      }
    }

    const response = await baseFetch(input, nextInit);
    if (
      response.headers.get("content-type")?.includes("text/event-stream")
    ) {
      return transformEventStream(response, metadataByToolCall);
    }
    try {
      const payload = await response.clone().json();
      captureReasoningMetadata(payload, metadataByToolCall);
      exposeReadableReasoning(payload);
      const headers = new Headers(response.headers);
      headers.delete("content-length");
      headers.delete("content-encoding");
      return new Response(JSON.stringify(payload), {
        status: response.status,
        statusText: response.statusText,
        headers,
      });
    } catch {
      // Non JSON responses are handled by the provider SDK.
    }
    return response;
  }) as typeof fetch;
}
