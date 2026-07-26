import { beforeEach, describe, expect, it } from "vitest";
import {
  LLM_CONFIG_KEY,
  readLLMConfig,
  writeLLMConfig,
} from "@/lib/agent/config";

describe("LLM configuration", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("migrates legacy configuration with thinking disabled", () => {
    localStorage.setItem(
      LLM_CONFIG_KEY,
      JSON.stringify({
        baseURL: "https://api.openai.com/v1",
        apiKey: "test-key",
        model: "gpt-5.4",
      })
    );

    expect(readLLMConfig()).toMatchObject({
      thinkingEnabled: false,
    });
  });

  it("persists the thinking preference", () => {
    writeLLMConfig({
      baseURL: "https://api.openai.com/v1",
      apiKey: "test-key",
      model: "gpt-5.4",
      thinkingEnabled: true,
    });

    expect(readLLMConfig()).toMatchObject({
      thinkingEnabled: true,
    });
  });
});
