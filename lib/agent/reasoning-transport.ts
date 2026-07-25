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

function exposeReadableReasoning(payload: unknown): void {
  if (!isRecord(payload) || !Array.isArray(payload.choices)) return;

  for (const choice of payload.choices) {
    if (!isRecord(choice) || !isRecord(choice.message)) continue;
    if (typeof choice.message.reasoning_content === "string") continue;

    const readableReasoning = reasoningValueToText([
      choice.message.reasoning,
      choice.message.reasoning_details,
      choice.message.extra_content,
    ]);
    if (readableReasoning) {
      choice.message.reasoning_content = readableReasoning;
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
