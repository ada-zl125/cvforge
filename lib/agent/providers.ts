import type { LLMConfig } from "./config";

export type LLMProviderId =
  | "openai"
  | "anthropic"
  | "google"
  | "deepseek"
  | "zai"
  | "minimax"
  | "openrouter"
  | "qwen"
  | "moonshot"
  | "xai"
  | "mistral"
  | "groq"
  | "ollama"
  | "custom";

export type LLMTransport =
  | "openai-responses"
  | "openai-compatible"
  | "anthropic"
  | "google"
  | "deepseek";

export type ThinkingControl = "toggle" | "always" | "unavailable";

export type ThinkingProtocol =
  | "openai"
  | "anthropic"
  | "google"
  | "deepseek"
  | "zai"
  | "minimax"
  | "openrouter"
  | "qwen"
  | "moonshot"
  | "xai"
  | "none";

interface ProviderDefinition {
  id: LLMProviderId;
  label: string;
  hostPatterns: RegExp[];
  modelPatterns: RegExp[];
  thinkingProtocol: ThinkingProtocol;
  supportsThinking: (model: string) => boolean;
}

export interface LLMProviderProfile {
  id: LLMProviderId;
  label: string;
  transport: LLMTransport;
  thinkingProtocol: ThinkingProtocol;
  supportsThinking: boolean;
  thinkingControl: ThinkingControl;
}

const PROVIDERS: ProviderDefinition[] = [
  {
    id: "openrouter",
    label: "OpenRouter",
    hostPatterns: [/openrouter\.ai$/i],
    modelPatterns: [],
    thinkingProtocol: "openrouter",
    supportsThinking: () => true,
  },
  {
    id: "openai",
    label: "OpenAI",
    hostPatterns: [/api\.openai\.com$/i],
    modelPatterns: [/^(?:gpt|chatgpt|o\d|codex)/i],
    thinkingProtocol: "openai",
    supportsThinking: (model) => /^(?:gpt-5|o\d|gpt-oss)/i.test(model),
  },
  {
    id: "anthropic",
    label: "Anthropic",
    hostPatterns: [/api\.anthropic\.com$/i],
    modelPatterns: [/^claude/i],
    thinkingProtocol: "anthropic",
    supportsThinking: (model) =>
      /^claude-(?:3[.-]7|4|5|opus-[45]|sonnet-[45])/i.test(model),
  },
  {
    id: "google",
    label: "Google",
    hostPatterns: [/generativelanguage\.googleapis\.com$/i],
    modelPatterns: [/^gemini/i],
    thinkingProtocol: "google",
    supportsThinking: (model) => /^gemini-(?:2[.-]5|3)/i.test(model),
  },
  {
    id: "deepseek",
    label: "DeepSeek",
    hostPatterns: [/api\.deepseek\.com$/i],
    modelPatterns: [/deepseek/i],
    thinkingProtocol: "deepseek",
    supportsThinking: () => true,
  },
  {
    id: "zai",
    label: "Z.AI",
    hostPatterns: [/(?:api\.z\.ai|open\.bigmodel\.cn)$/i],
    modelPatterns: [/^glm/i],
    thinkingProtocol: "zai",
    supportsThinking: (model) => /^glm-(?:4[.-][5-9]|5)/i.test(model),
  },
  {
    id: "minimax",
    label: "MiniMax",
    hostPatterns: [/(?:api\.minimax\.io|api\.minimaxi\.com)$/i],
    modelPatterns: [/minimax/i],
    thinkingProtocol: "minimax",
    supportsThinking: (model) => /minimax-m/i.test(model),
  },
  {
    id: "qwen",
    label: "Qwen",
    hostPatterns: [/dashscope\.aliyuncs\.com$/i],
    modelPatterns: [/^(?:qwen|qwq)/i],
    thinkingProtocol: "qwen",
    supportsThinking: (model) =>
      /^(?:qwen3|qwen-(?:plus|max|flash)|qwq)/i.test(model),
  },
  {
    id: "moonshot",
    label: "Moonshot",
    hostPatterns: [/api\.moonshot\.(?:cn|ai)$/i],
    modelPatterns: [/^(?:kimi|moonshot)/i],
    thinkingProtocol: "moonshot",
    supportsThinking: (model) => /^(?:kimi|moonshot)/i.test(model),
  },
  {
    id: "xai",
    label: "xAI",
    hostPatterns: [/api\.x\.ai$/i],
    modelPatterns: [/^grok/i],
    thinkingProtocol: "xai",
    supportsThinking: (model) => /^grok-(?:3-mini|4)/i.test(model),
  },
  {
    id: "mistral",
    label: "Mistral",
    hostPatterns: [/api\.mistral\.ai$/i],
    modelPatterns: [/^(?:mistral|codestral|devstral)/i],
    thinkingProtocol: "none",
    supportsThinking: () => false,
  },
  {
    id: "groq",
    label: "Groq",
    hostPatterns: [/api\.groq\.com$/i],
    modelPatterns: [],
    thinkingProtocol: "none",
    supportsThinking: () => false,
  },
  {
    id: "ollama",
    label: "Ollama",
    hostPatterns: [/^(?:localhost|127\.0\.0\.1)$/i],
    modelPatterns: [/^(?:llama|gemma|phi)/i],
    thinkingProtocol: "none",
    supportsThinking: () => false,
  },
];

const CUSTOM_PROVIDER: ProviderDefinition = {
  id: "custom",
  label: "OpenAI compatible",
  hostPatterns: [],
  modelPatterns: [],
  thinkingProtocol: "none",
  supportsThinking: () => false,
};

function readEndpoint(baseURL: string): { hostname: string; pathname: string } {
  try {
    const url = new URL(baseURL);
    return {
      hostname: url.hostname.toLowerCase(),
      pathname: url.pathname.toLowerCase(),
    };
  } catch {
    return { hostname: "", pathname: "" };
  }
}

function findEndpointProvider(hostname: string): ProviderDefinition | undefined {
  return PROVIDERS.find((provider) =>
    provider.hostPatterns.some((pattern) => pattern.test(hostname))
  );
}

function findModelProvider(model: string): ProviderDefinition | undefined {
  return PROVIDERS.find((provider) =>
    provider.modelPatterns.some((pattern) => pattern.test(model))
  );
}

function resolveTransport(
  provider: ProviderDefinition,
  endpointProvider: ProviderDefinition | undefined,
  pathname: string
): LLMTransport {
  if (endpointProvider?.id === "openai") return "openai-responses";
  if (endpointProvider?.id === "anthropic") return "anthropic";
  if (
    endpointProvider?.id === "minimax" &&
    pathname.includes("/anthropic")
  ) {
    return "anthropic";
  }
  if (endpointProvider?.id === "deepseek") return "deepseek";
  if (endpointProvider?.id === "google" && !pathname.includes("/openai")) {
    return "google";
  }
  return "openai-compatible";
}

function resolveThinkingControl(
  provider: ProviderDefinition,
  model: string,
  supported: boolean
): ThinkingControl {
  if (!supported) return "unavailable";
  if (provider.id === "minimax" && /minimax-m2/i.test(model)) return "always";
  if (
    provider.id === "google" &&
    /^(?:gemini-3|gemini-2[.-]5-pro)/i.test(model)
  ) {
    return "always";
  }
  if (
    provider.id === "deepseek" &&
    /(?:reasoner|(?:^|[/.-])r1(?:[/.-]|$))/i.test(model)
  ) {
    return "always";
  }
  if (
    provider.id === "openai" &&
    /^(?:o\d|gpt-oss)/i.test(model)
  ) {
    return "always";
  }
  if (
    provider.id === "moonshot" &&
    /thinking/i.test(model)
  ) {
    return "always";
  }
  if (
    provider.id === "xai" &&
    /^grok-(?:3-mini|4)/i.test(model)
  ) {
    return "always";
  }
  if (
    provider.id === "qwen" &&
    /(?:thinking|(?:^|[/.-])qwq(?:[/.-]|$))/i.test(model)
  ) {
    return "always";
  }
  return "toggle";
}

export function resolveLLMProvider(config: Pick<LLMConfig, "baseURL" | "model">): LLMProviderProfile {
  const endpoint = readEndpoint(config.baseURL);
  const endpointProvider = findEndpointProvider(endpoint.hostname);
  const provider =
    endpointProvider ?? findModelProvider(config.model.trim()) ?? CUSTOM_PROVIDER;
  const transport = resolveTransport(provider, endpointProvider, endpoint.pathname);
  const usesKnownProtocol =
    endpointProvider !== undefined ||
    transport === "openai-responses" ||
    transport === "anthropic" ||
    transport === "google" ||
    transport === "deepseek";
  const supportsThinking =
    usesKnownProtocol && provider.supportsThinking(config.model.trim());

  return {
    id: provider.id,
    label: provider.label,
    transport,
    thinkingProtocol: usesKnownProtocol ? provider.thinkingProtocol : "none",
    supportsThinking,
    thinkingControl: resolveThinkingControl(
      provider,
      config.model.trim(),
      supportsThinking
    ),
  };
}

export function normalizeProviderBaseURL(
  baseURL: string,
  transport: LLMTransport
): string {
  const normalized = baseURL.trim().replace(/\/+$/, "");

  if (transport === "anthropic") {
    return normalized.replace(/\/v1$/i, "");
  }

  if (transport === "google") {
    return normalized.replace(/\/v1(?:beta)?(?:\/openai)?$/i, "");
  }

  return normalized;
}
