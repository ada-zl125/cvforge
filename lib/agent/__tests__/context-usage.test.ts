import { AIMessage, HumanMessage } from "langchain";
import { describe, expect, it } from "vitest";
import {
  extractLatestContextUsage,
  getModelMaxInputTokens,
} from "@/lib/agent/context-usage";

describe("agent context usage", () => {
  it("reads the latest completed model input usage", () => {
    const usage = extractLatestContextUsage(
      [
        new HumanMessage("First turn"),
        new AIMessage({
          content: "First response",
          usage_metadata: {
            input_tokens: 120,
            output_tokens: 20,
            total_tokens: 140,
          },
        }),
        new HumanMessage("Second turn"),
        new AIMessage({
          content: "Second response",
          usage_metadata: {
            input_tokens: 360,
            output_tokens: 40,
            total_tokens: 400,
          },
        }),
      ],
      "test-model",
      128_000
    );

    expect(usage).toEqual({
      inputTokens: 360,
      maxInputTokens: 128_000,
      model: "test-model",
    });
  });

  it("does not reuse stale usage when the latest response omits it", () => {
    const usage = extractLatestContextUsage(
      [
        new AIMessage({
          content: "Measured response",
          usage_metadata: {
            input_tokens: 120,
            output_tokens: 20,
            total_tokens: 140,
          },
        }),
        new AIMessage("Unmeasured response"),
      ],
      "test-model",
      128_000
    );

    expect(usage).toBeNull();
  });

  it("uses only a valid model profile limit", () => {
    expect(
      getModelMaxInputTokens({ profile: { maxInputTokens: 200_000 } })
    ).toBe(200_000);
    expect(
      getModelMaxInputTokens({ profile: { maxInputTokens: 0 } })
    ).toBeUndefined();
    expect(getModelMaxInputTokens({})).toBeUndefined();
  });
});
