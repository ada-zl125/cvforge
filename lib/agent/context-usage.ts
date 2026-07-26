import { AIMessage } from "langchain";

export interface AgentContextUsage {
  inputTokens: number;
  maxInputTokens?: number;
  model: string;
}

interface ModelWithProfile {
  profile?: {
    maxInputTokens?: number;
  };
}

export function getModelMaxInputTokens(
  model: ModelWithProfile
): number | undefined {
  const maxInputTokens = model.profile?.maxInputTokens;
  return typeof maxInputTokens === "number" &&
    Number.isFinite(maxInputTokens) &&
    maxInputTokens > 0
    ? maxInputTokens
    : undefined;
}

export function extractLatestContextUsage(
  messages: unknown[],
  model: string,
  maxInputTokens?: number
): AgentContextUsage | null {
  for (const message of [...messages].reverse()) {
    if (!AIMessage.isInstance(message)) continue;
    if (message.additional_kwargs?.lc_source === "summarization") continue;

    const inputTokens = message.usage_metadata?.input_tokens;
    if (
      typeof inputTokens !== "number" ||
      !Number.isFinite(inputTokens) ||
      inputTokens < 0
    ) {
      return null;
    }

    return {
      inputTokens,
      maxInputTokens,
      model,
    };
  }

  return null;
}
