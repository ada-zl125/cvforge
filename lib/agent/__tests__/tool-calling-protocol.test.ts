import { describe, expect, it } from "vitest";
import { AIMessage, HumanMessage, ToolMessage } from "@langchain/core/messages";
import { tool } from "@langchain/core/tools";
import { ChatDeepSeek } from "@langchain/deepseek";
import { z } from "zod";

describe("official tool calling protocol", () => {
  it("serializes v1 parallel tool results with their preceding tool calls", async () => {
    const requestBodies: Array<Record<string, unknown>> = [];
    const model = new ChatDeepSeek({
      apiKey: "test-key",
      model: "deepseek-chat",
      configuration: {
        fetch: async (_input, init) => {
          requestBodies.push(JSON.parse(String(init?.body)));
          return new Response(
            JSON.stringify({
              id: "chatcmpl-test",
              object: "chat.completion",
              created: 1,
              model: "deepseek-chat",
              choices: [
                {
                  index: 0,
                  message: { role: "assistant", content: "Done" },
                  finish_reason: "stop",
                },
              ],
              usage: {
                prompt_tokens: 1,
                completion_tokens: 1,
                total_tokens: 2,
              },
            }),
            { headers: { "content-type": "application/json" } }
          );
        },
      },
    });
    const readFile = tool(async () => "contents", {
      name: "read_file",
      description: "Read a file",
      schema: z.object({ file_path: z.string() }),
    });
    const listFiles = tool(async () => "profile.pdf", {
      name: "ls",
      description: "List files",
      schema: z.object({ path: z.string() }),
    });
    const assistant = new AIMessage({
      content: "",
      tool_calls: [
        {
          id: "call_read",
          name: "read_file",
          args: { file_path: "/references/profile.pdf.txt" },
          type: "tool_call",
        },
        {
          id: "call_list",
          name: "ls",
          args: { path: "/references" },
          type: "tool_call",
        },
      ],
      response_metadata: { output_version: "v1" },
    });

    await model.bindTools([readFile, listFiles]).invoke([
      new HumanMessage("Read my uploaded resume"),
      assistant,
      new ToolMessage({
        content: "Education: Imperial College London",
        tool_call_id: "call_read",
      }),
      new ToolMessage({
        content: "profile.pdf",
        tool_call_id: "call_list",
      }),
    ]);

    const messages = requestBodies[0].messages as Array<Record<string, unknown>>;
    expect(messages.map((message) => message.role)).toEqual([
      "user",
      "assistant",
      "tool",
      "tool",
    ]);
    expect(messages[1].tool_calls).toEqual([
      {
        id: "call_read",
        type: "function",
        function: {
          name: "read_file",
          arguments: '{"file_path":"/references/profile.pdf.txt"}',
        },
      },
      {
        id: "call_list",
        type: "function",
        function: {
          name: "ls",
          arguments: '{"path":"/references"}',
        },
      },
    ]);
    expect(messages.slice(2).map((message) => message.tool_call_id)).toEqual([
      "call_read",
      "call_list",
    ]);
  });
});
