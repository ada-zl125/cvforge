import { describe, expect, it } from "vitest";
import { AIMessage } from "@langchain/core/messages";
import {
  extractAssistantReasoning,
  reasoningValueToText,
} from "@/lib/agent/reasoning";

describe("reasoning extraction", () => {
  it("reads standardized and provider specific reasoning", () => {
    const messages = [
      new AIMessage({
        content: [{ type: "reasoning", reasoning: "OpenAI summary" }],
        additional_kwargs: {
          reasoning_details: [{ type: "reasoning.text", text: "Provider detail" }],
        },
      }),
    ];

    expect(extractAssistantReasoning(messages)).toContain("OpenAI summary");
    expect(extractAssistantReasoning(messages)).toContain("Provider detail");
  });

  it("does not display encrypted or redacted reasoning", () => {
    expect(
      reasoningValueToText([
        { type: "redacted_thinking", data: "secret" },
        { type: "reasoning.encrypted", text: "hidden" },
      ])
    ).toBe("");
  });
});
