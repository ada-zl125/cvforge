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

  it("streams readable reasoning and preserves it for parallel tool calls", async () => {
    const requests: Array<Record<string, unknown>> = [];
    const encoder = new TextEncoder();
    const events = [
      'data: {"choices":[{"index":0,"delta":{"reasoning_content":"Inspect "}}]}\n\n',
      'data: {"choices":[{"index":0,"delta":{"reasoning_content":"carefully.","tool_calls":[{"id":"call_1","type":"function","function":{"name":"update_summary","arguments":"{}"}},{"id":"call_2","type":"function","function":{"name":"update_skills","arguments":"{}"}}]}}]}\n\n',
      "data: [DONE]\n\n",
    ];
    const baseFetch = vi.fn(
      async (_input: RequestInfo | URL, init?: RequestInit) => {
        requests.push(JSON.parse(String(init?.body)));
        if (requests.length === 1) {
          return new Response(
            new ReadableStream({
              start(controller) {
                for (const event of events) {
                  const midpoint = Math.floor(event.length / 2);
                  controller.enqueue(encoder.encode(event.slice(0, midpoint)));
                  controller.enqueue(encoder.encode(event.slice(midpoint)));
                }
                controller.close();
              },
            }),
            { headers: { "content-type": "text/event-stream" } }
          );
        }
        return Response.json({
          choices: [{ message: { role: "assistant", content: "Done" } }],
        });
      }
    );
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
    expect(await firstResponse.text()).toContain(
      '"reasoning_content":"carefully."'
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
                function: { name: "update_summary", arguments: "{}" },
              },
              {
                id: "call_2",
                type: "function",
                function: { name: "update_skills", arguments: "{}" },
              },
            ],
          },
        ],
      }),
    });

    expect(
      (requests[1].messages as Array<Record<string, unknown>>)[0]
        .reasoning_content
    ).toBe("Inspect carefully.");
  });
});
