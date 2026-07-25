import { describe, expect, it } from "vitest";
import { ChatAnthropic } from "@langchain/anthropic";
import { ChatDeepSeek } from "@langchain/deepseek";
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { ChatOpenAI } from "@langchain/openai";
import { createAgentChatModel } from "@/lib/agent/model";

describe("LangChain provider models", () => {
  it("uses the OpenAI Responses API for the official endpoint", () => {
    const model = createAgentChatModel({
      apiKey: "test-key",
      baseURL: "https://api.openai.com/v1",
      model: "gpt-5.4",
      thinkingEnabled: true,
    });

    expect(model).toBeInstanceOf(ChatOpenAI);
    expect((model as ChatOpenAI).useResponsesApi).toBe(true);
    expect((model as ChatOpenAI).reasoning).toMatchObject({
      effort: "medium",
      summary: "auto",
    });
  });

  it("uses the native Anthropic integration", () => {
    const model = createAgentChatModel({
      apiKey: "test-key",
      baseURL: "https://api.anthropic.com/v1",
      model: "claude-sonnet-4-6",
      thinkingEnabled: true,
    });

    expect(model).toBeInstanceOf(ChatAnthropic);
    expect((model as ChatAnthropic).thinking).toMatchObject({
      type: "enabled",
      budget_tokens: 2048,
    });
  });

  it("uses the native DeepSeek integration", () => {
    const model = createAgentChatModel({
      apiKey: "test-key",
      baseURL: "https://api.deepseek.com",
      model: "deepseek-chat",
      thinkingEnabled: true,
    });

    expect(model).toBeInstanceOf(ChatDeepSeek);
    expect((model as ChatDeepSeek).modelKwargs).toMatchObject({
      parallel_tool_calls: false,
      thinking: { type: "enabled" },
    });
  });

  it("uses the native Google integration", () => {
    const model = createAgentChatModel({
      apiKey: "test-key",
      baseURL: "https://generativelanguage.googleapis.com/v1beta",
      model: "gemini-2.5-flash",
      thinkingEnabled: true,
    });

    expect(model).toBeInstanceOf(ChatGoogleGenerativeAI);
    expect((model as ChatGoogleGenerativeAI).thinkingConfig).toMatchObject({
      includeThoughts: true,
      thinkingBudget: 2048,
    });
  });
});
