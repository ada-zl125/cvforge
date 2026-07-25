import { describe, expect, it, vi } from "vitest";
import { createReasoningAwareFetch } from "@/lib/agent/reasoning-transport";

describe("provider reasoning transport", () => {
  it("preserves opaque reasoning metadata across tool calls", async () => {
    const requests: Array<Record<string, unknown>> = [];
    const baseFetch = vi.fn(async (_input: RequestInfo | URL, init?: RequestInit) => {
      requests.push(JSON.parse(String(init?.body)));
      if (requests.length === 1) {
        return new Response(
          JSON.stringify({
            choices: [
              {
                message: {
                  role: "assistant",
                  content: "",
                  reasoning_details: [
                    { type: "reasoning.text", text: "Inspect the document." },
                    { type: "reasoning.encrypted", data: "opaque" },
                  ],
                  tool_calls: [
                    {
                      id: "call_1",
                      type: "function",
                      function: { name: "read_file", arguments: "{}" },
                    },
                  ],
                },
              },
            ],
          }),
          { headers: { "content-type": "application/json" } }
        );
      }

      return new Response(
        JSON.stringify({
          choices: [
            {
              message: {
                role: "assistant",
                content: "Done",
              },
            },
          ],
        }),
        { headers: { "content-type": "application/json" } }
      );
    });
    const reasoningFetch = createReasoningAwareFetch(
      baseFetch as unknown as typeof fetch
    );

    const firstResponse = await reasoningFetch(
      "https://provider.example/v1/chat/completions",
      {
        method: "POST",
        body: JSON.stringify({
          messages: [{ role: "user", content: "Update my document" }],
        }),
      }
    );
    const firstPayload = await firstResponse.json();
    expect(firstPayload.choices[0].message.reasoning_content).toBe(
      "Inspect the document."
    );

    await reasoningFetch("https://provider.example/v1/chat/completions", {
      method: "POST",
      body: JSON.stringify({
        messages: [
          {
            role: "assistant",
            content: "",
            tool_calls: [
              {
                id: "call_1",
                type: "function",
                function: { name: "read_file", arguments: "{}" },
              },
            ],
          },
          { role: "tool", tool_call_id: "call_1", content: "result" },
        ],
      }),
    });

    expect(
      (requests[1].messages as Array<Record<string, unknown>>)[0]
        .reasoning_details
    ).toEqual([
      { type: "reasoning.text", text: "Inspect the document." },
      { type: "reasoning.encrypted", data: "opaque" },
    ]);
  });
});
