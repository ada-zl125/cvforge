"use client";

import { ChatOpenAI } from "@langchain/openai";
import type { LLMConfig } from "./config";

interface ChatModelOptions {
  maxRetries?: number;
  maxTokens?: number;
  temperature?: number;
}

export function createAgentChatModel(
  config: LLMConfig,
  options: ChatModelOptions = {}
): ChatOpenAI {
  return new ChatOpenAI({
    apiKey: config.apiKey,
    model: config.model,
    maxRetries: options.maxRetries ?? 0,
    maxTokens: options.maxTokens,
    temperature: options.temperature,
    streamUsage: false,
    useResponsesApi: false,
    modelKwargs: {
      parallel_tool_calls: false,
    },
    configuration: {
      baseURL: config.baseURL.replace(/\/+$/, ""),
    },
  });
}

export async function validateLLMConfig(config: LLMConfig): Promise<void> {
  const model = createAgentChatModel(config, {
    maxRetries: 1,
    maxTokens: 10,
    temperature: 0,
  });

  await model.invoke("ping");
}
