import { describe, expect, it } from "vitest";
import { AIMessage } from "@langchain/core/messages";
import {
  extractAssistantReasoning,
  reasoningValueToText,
} from "@/lib/agent/reasoning";
import { createReasoningAwareFetch } from "@/lib/agent/reasoning-transport";

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

describe("OpenAI compatible reasoning transport", () => {
  it("passes provider reasoning back with a tool call", async () => {
    const requestBodies: Array<Record<string, unknown>> = [];
    const baseFetch = async (_input: RequestInfo | URL, init?: RequestInit) => {
      requestBodies.push(JSON.parse(String(init?.body)));
      const firstRequest = requestBodies.length === 1;
      return new Response(
        JSON.stringify({
          choices: [{
            message: firstRequest
              ? {
                  role: "assistant",
                  content: "",
                  reasoning_content: "Inspect the document",
                  tool_calls: [{
                    id: "call_read",
                    type: "function",
                    function: { name: "read_file", arguments: "{}" },
                  }],
                }
              : { role: "assistant", content: "Done" },
          }],
        }),
        { headers: { "content-type": "application/json" } }
      );
    };
    const reasoningFetch = createReasoningAwareFetch(baseFetch as typeof fetch);

    await reasoningFetch("https://api.deepseek.com/chat/completions", {
      method: "POST",
      body: JSON.stringify({ messages: [{ role: "user", content: "Edit" }] }),
    });
    await reasoningFetch("https://api.deepseek.com/chat/completions", {
      method: "POST",
      body: JSON.stringify({
        messages: [{
          role: "assistant",
          content: "",
          tool_calls: [{
            id: "call_read",
            type: "function",
            function: { name: "read_file", arguments: "{}" },
          }],
        }],
      }),
    });

    const messages = requestBodies[1].messages as Array<Record<string, unknown>>;
    expect(messages[0].reasoning_content).toBe("Inspect the document");
  });

  it("maps reasoning details to a readable LangChain field", async () => {
    const baseFetch = async () =>
      new Response(
        JSON.stringify({
          choices: [{
            message: {
              role: "assistant",
              content: "Done",
              reasoning_details: [{
                type: "reasoning.text",
                text: "Checked the supplied evidence",
              }],
            },
          }],
        }),
        { headers: { "content-type": "application/json" } }
      );
    const response = await createReasoningAwareFetch(baseFetch as typeof fetch)(
      "https://api.minimax.io/v1/chat/completions",
      { method: "POST", body: JSON.stringify({ messages: [] }) }
    );

    const payload = await response.json();
    expect(payload.choices[0].message.reasoning_content)
      .toBe("Checked the supplied evidence");
  });
});

