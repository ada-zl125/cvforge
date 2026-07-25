const MAX_REASONING_DISPLAY_CHARS = 24000;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function collectReasoningText(value: unknown): string[] {
  if (typeof value === "string") return value.trim() ? [value.trim()] : [];
  if (Array.isArray(value)) return value.flatMap(collectReasoningText);
  if (!isRecord(value)) return [];

  if (
    value.type === "redacted_thinking" ||
    value.type === "encrypted_reasoning" ||
    value.type === "reasoning.encrypted"
  ) {
    return [];
  }

  const candidates = [
    value.reasoning,
    value.reasoning_content,
    value.thinking,
    value.text,
    value.summary,
    value.content,
    value.details,
  ];

  return candidates.flatMap(collectReasoningText);
}

export function reasoningValueToText(value: unknown): string {
  return Array.from(new Set(collectReasoningText(value)))
    .join("\n\n")
    .trim();
}

export function extractMessageReasoning(message: unknown): string {
  if (!isRecord(message)) return "";

  const additionalKwargs = isRecord(message.additional_kwargs)
    ? message.additional_kwargs
    : {};
  const candidates = [
    additionalKwargs.reasoning_content,
    additionalKwargs.reasoning_details,
    additionalKwargs.reasoning,
    additionalKwargs.extra_content,
    message.reasoning_content,
    message.reasoning_details,
    message.reasoning,
  ];

  if (Array.isArray(message.content)) {
    candidates.push(
      message.content.filter(
        (block) =>
          isRecord(block) &&
          (["reasoning", "reasoning_content", "thinking"].includes(
            String(block.type)
          ) ||
            block.thought === true)
      )
    );
  }

  return reasoningValueToText(candidates);
}

export function extractAssistantReasoning(messages: unknown[]): string {
  const reasoning = Array.from(
    new Set(messages.map(extractMessageReasoning).filter(Boolean))
  )
    .join("\n\n")
    .trim();

  if (reasoning.length <= MAX_REASONING_DISPLAY_CHARS) return reasoning;
  return `${reasoning.slice(0, MAX_REASONING_DISPLAY_CHARS).trimEnd()}\n\n…`;
}
