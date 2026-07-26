import { describe, expect, it } from "vitest";
import { ChatAnthropic } from "@langchain/anthropic";
import { ChatDeepSeek } from "@langchain/deepseek";
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { ChatOpenAI } from "@langchain/openai";
import { createAgentChatModel } from "@/lib/agent/model";
import {
  normalizeProviderBaseURL,
  resolveLLMProvider,
} from "@/lib/agent/providers";

function profile(baseURL: string, model: string) {
  return resolveLLMProvider({ baseURL, model });
}

describe("LLM provider resolution", () => {
  it("uses native LangChain transports for official providers", () => {
    expect(profile("https://api.openai.com/v1", "gpt-5.4")).toMatchObject({
      id: "openai",
      transport: "openai-responses",
      thinkingControl: "toggle",
    });
    expect(
      profile("https://api.anthropic.com/v1", "claude-sonnet-4-6")
    ).toMatchObject({
      id: "anthropic",
      transport: "anthropic",
      thinkingControl: "toggle",
    });
    expect(profile("https://api.deepseek.com", "deepseek-chat")).toMatchObject({
      id: "deepseek",
      transport: "deepseek",
      thinkingControl: "toggle",
    });
    expect(
      profile(
        "https://generativelanguage.googleapis.com/v1beta",
        "gemini-2.5-flash"
      )
    ).toMatchObject({
      id: "google",
      transport: "google",
      thinkingControl: "toggle",
    });
  });

  it("recognizes fixed thinking models and compatible endpoints", () => {
    expect(
      profile("https://api.deepseek.com", "deepseek-reasoner")
    ).toMatchObject({
      thinkingControl: "always",
    });
    expect(
      profile("https://api.minimax.io/anthropic", "MiniMax-M2.7")
    ).toMatchObject({
      id: "minimax",
      transport: "anthropic",
      thinkingControl: "always",
    });
    expect(
      profile("https://api.z.ai/api/paas/v4", "glm-4.7")
    ).toMatchObject({
      id: "zai",
      transport: "openai-compatible",
      thinkingControl: "toggle",
    });
    expect(
      profile(
        "https://generativelanguage.googleapis.com/v1beta/openai",
        "gemini-3-flash"
      )
    ).toMatchObject({
      id: "google",
      transport: "openai-compatible",
      thinkingControl: "always",
    });
  });

  it("does not send a guessed thinking protocol to unknown gateways", () => {
    expect(profile("https://llm.example.com/v1", "qwen3.5-plus")).toMatchObject({
      id: "qwen",
      transport: "openai-compatible",
      thinkingProtocol: "none",
      thinkingControl: "unavailable",
    });
  });

  it("normalizes native provider base URLs", () => {
    expect(normalizeProviderBaseURL("https://api.anthropic.com/v1/", "anthropic"))
      .toBe("https://api.anthropic.com");
    expect(
      normalizeProviderBaseURL(
        "https://generativelanguage.googleapis.com/v1beta/",
        "google"
      )
    ).toBe("https://generativelanguage.googleapis.com");
  });

  it("creates LangChain native chat models for official APIs", () => {
    const config = {
      apiKey: "test-key",
      thinkingEnabled: false,
    };

    expect(createAgentChatModel({
      ...config,
      baseURL: "https://api.anthropic.com/v1",
      model: "claude-sonnet-4-6",
    })).toBeInstanceOf(ChatAnthropic);
    expect(createAgentChatModel({
      ...config,
      baseURL: "https://api.deepseek.com",
      model: "deepseek-chat",
    })).toBeInstanceOf(ChatDeepSeek);
    expect(createAgentChatModel({
      ...config,
      baseURL: "https://generativelanguage.googleapis.com/v1beta",
      model: "gemini-2.5-flash",
    })).toBeInstanceOf(ChatGoogleGenerativeAI);

    const openAI = createAgentChatModel({
      ...config,
      baseURL: "https://api.openai.com/v1",
      model: "gpt-5.4",
      thinkingEnabled: true,
    });
    expect(openAI).toBeInstanceOf(ChatOpenAI);
    expect((openAI as ChatOpenAI).useResponsesApi).toBe(true);
  });
});
