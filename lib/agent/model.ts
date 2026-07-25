"use client";

import { ChatAnthropic } from "@langchain/anthropic";
import { ChatDeepSeek } from "@langchain/deepseek";
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { ChatOpenAI } from "@langchain/openai";
import type { LLMConfig } from "./config";
import {
  normalizeProviderBaseURL,
  resolveLLMProvider,
  type LLMProviderProfile,
} from "./providers";

interface ChatModelOptions {
  maxRetries?: number;
  maxTokens?: number;
  temperature?: number;
  thinkingEnabled?: boolean;
}

const contextWindowCache = new Map<string, number | undefined>();

function createCompatibleModelKwargs(
  provider: LLMProviderProfile,
  thinkingEnabled: boolean
): Record<string, unknown> {
  const modelKwargs: Record<string, unknown> = {};

  switch (provider.thinkingProtocol) {
    case "deepseek":
      if (provider.thinkingControl !== "always") {
        modelKwargs.thinking = {
          type: thinkingEnabled ? "enabled" : "disabled",
        };
      }
      break;
    case "zai":
      modelKwargs.thinking = {
        type: thinkingEnabled ? "enabled" : "disabled",
        ...(thinkingEnabled ? { clear_thinking: false } : {}),
      };
      break;
    case "minimax":
      modelKwargs.reasoning_split = true;
      break;
    case "openrouter":
      if (thinkingEnabled) {
        modelKwargs.reasoning = { effort: "medium", exclude: false };
      }
      break;
    case "qwen":
      if (provider.thinkingControl !== "always") {
        modelKwargs.enable_thinking = thinkingEnabled;
      }
      break;
    case "moonshot":
      modelKwargs.thinking = {
        type: thinkingEnabled ? "enabled" : "disabled",
      };
      break;
    case "xai":
      if (thinkingEnabled) modelKwargs.reasoning_effort = "medium";
      break;
    case "google":
      modelKwargs.reasoning_effort = thinkingEnabled ? "medium" : "none";
      break;
  }

  return modelKwargs;
}

export function createAgentChatModel(
  config: LLMConfig,
  options: ChatModelOptions = {}
): ChatOpenAI | ChatAnthropic | ChatDeepSeek | ChatGoogleGenerativeAI {
  const provider = resolveLLMProvider(config);
  const thinkingEnabled =
    provider.thinkingControl === "always" ||
    (provider.thinkingControl === "toggle" &&
      (options.thinkingEnabled ?? config.thinkingEnabled ?? false));
  const baseURL = normalizeProviderBaseURL(config.baseURL, provider.transport);

  if (provider.transport === "anthropic") {
    const adaptiveThinking =
      thinkingEnabled &&
      /claude-(?:opus-4[-.][678]|(?:opus|fable|mythos)-5|mythos-preview)/i.test(
        config.model
      );
    return new ChatAnthropic({
      apiKey: config.apiKey,
      model: config.model,
      maxRetries: options.maxRetries ?? 0,
      maxTokens:
        options.maxTokens ?? (thinkingEnabled ? 8192 : undefined),
      temperature: thinkingEnabled ? undefined : options.temperature,
      streamUsage: false,
      thinking: thinkingEnabled && provider.thinkingControl !== "always"
        ? adaptiveThinking
          ? { type: "adaptive" }
          : { type: "enabled", budget_tokens: 2048 }
        : undefined,
      clientOptions: {
        apiKey: config.apiKey,
        baseURL,
        dangerouslyAllowBrowser: true,
      },
    });
  }

  if (provider.transport === "google") {
    const usesThinkingLevel = /^gemini-3/i.test(config.model);
    return new ChatGoogleGenerativeAI({
      apiKey: config.apiKey,
      model: config.model,
      baseUrl: baseURL,
      maxRetries: options.maxRetries ?? 0,
      maxOutputTokens: options.maxTokens,
      temperature: options.temperature,
      streamUsage: false,
      thinkingConfig: thinkingEnabled
        ? {
            includeThoughts: true,
            ...(usesThinkingLevel
              ? { thinkingLevel: "MEDIUM" as const }
              : { thinkingBudget: 2048 }),
          }
        : {
            includeThoughts: false,
            ...(usesThinkingLevel
              ? { thinkingLevel: "LOW" as const }
              : { thinkingBudget: 0 }),
          },
    });
  }

  if (provider.transport === "deepseek") {
    return new ChatDeepSeek({
      apiKey: config.apiKey,
      model: config.model,
      maxRetries: options.maxRetries ?? 0,
      maxTokens: options.maxTokens,
      temperature: thinkingEnabled ? undefined : options.temperature,
      streamUsage: false,
      modelKwargs: createCompatibleModelKwargs(provider, thinkingEnabled),
      configuration: {
        baseURL,
      },
    });
  }

  return new ChatOpenAI({
    apiKey: config.apiKey,
    model: config.model,
    maxRetries: options.maxRetries ?? 0,
    maxTokens: options.maxTokens,
    temperature: thinkingEnabled ? undefined : options.temperature,
    streamUsage: false,
    useResponsesApi:
      provider.transport === "openai-responses" && thinkingEnabled,
    reasoning:
      provider.thinkingProtocol === "openai" && thinkingEnabled
        ? { effort: "medium", summary: "auto" }
        : undefined,
    modelKwargs:
      provider.transport === "openai-compatible"
        ? createCompatibleModelKwargs(provider, thinkingEnabled)
        : undefined,
    configuration: {
      baseURL,
    },
  });
}

export function getAgentModelContextWindow(
  config: LLMConfig
): number | undefined {
  const provider = resolveLLMProvider(config);
  const cacheKey = `${provider.transport}\u0000${config.model}`;
  if (contextWindowCache.has(cacheKey)) {
    return contextWindowCache.get(cacheKey);
  }

  try {
    const maxInputTokens = createAgentChatModel(config).profile.maxInputTokens;
    contextWindowCache.set(cacheKey, maxInputTokens);
    return maxInputTokens;
  } catch {
    contextWindowCache.set(cacheKey, undefined);
    return undefined;
  }
}

export async function validateLLMConfig(config: LLMConfig): Promise<void> {
  const model = createAgentChatModel(config, {
    maxRetries: 1,
    maxTokens: 10,
    temperature: 0,
    thinkingEnabled: false,
  });

  await model.invoke("ping");
}
