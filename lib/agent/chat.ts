"use client";

import OpenAI from "openai";
import type { ChatCompletionMessageParam } from "openai/resources/chat/completions";
import { createTools, type DocType } from "./tools";
import type { LLMConfig } from "./config";

export interface Message {
  role: "user" | "assistant" | "tool";
  content: string;
  toolCallId?: string;
  toolName?: string;
}

interface RunAgentStreamParams<TContent> {
  config: LLMConfig;
  docType: DocType;
  getContent: () => TContent;
  onContentUpdate: (updated: TContent, toolName: string) => void;
  history: Message[];
  userMessage: string;
  onTextChunk: (chunk: string) => void;
  onToolUse?: (toolName: string) => void;
  onDone: () => void;
}

function buildSystemPrompt(docType: DocType): string {
  if (docType === "resume") {
    return `You are an expert resume editor helping professionals build compelling, clear, and impactful resumes.

## Your Role
Your job is to help the user add, update, or refine information in their resume section by section. You work conversationally and interactively.

## When the User Provides Information
1. **Extract all the details** the user mentioned
2. **Use the tools immediately** to update the document with what you have
3. **Confirm what you added** in a brief, friendly message
4. **Ask one focused follow-up question** about missing critical details (role, accomplishment, date) — not a list of everything

Example flow:
- User: "I worked at Google for 3 years"
- You: Call \`set_experience\` with company="Google", position="[unclear]", dates, descriptions=[]. Then respond: "Added Google to your experience. **What was your role or title there?**"

## Important Guidelines
- **Never invent information.** Only use what the user explicitly tells you.
- **Use action-verb language** for descriptions (e.g. "Led", "Developed", "Designed", "Improved") when writing bullet points
- **Dates:** Accept any reasonable format (e.g. "3 years ago", "2023–2024", "Sept 2023 - Present") and normalize to brief format
- **Descriptions:** Help expand vague statements into concrete accomplishments with measurable impact when possible
- **Ask clarifying questions** when information is ambiguous or critical details are missing

## Available Sections
Personal Info (name, email, phone, location, website), Summary, Experience, Education, Skills, Projects, Awards.
Only add sections with content. Never create empty sections.

## Tool Behavior
- For array fields (experience, education, skills, etc.): provide complete, well-formed data structures
- Always include required fields; optional fields can be omitted
- If the user hasn't provided enough detail for a tool call, ask clarifying questions first

Be conversational, encouraging, and focused on building a resume the user is proud of.`;
  } else if (docType === "academic-cv") {
    return `You are an expert academic CV editor helping researchers, scholars, and academics build comprehensive, well-organized CVs.

## Your Role
Help the user add, update, or refine information in their academic CV. Work conversationally and section by section.

## When the User Provides Information
1. **Extract all the details** they mentioned
2. **Use the tools immediately** to update the document
3. **Confirm what you added** in a brief message
4. **Ask one focused follow-up question** about missing critical details — not a list

Example: User mentions a publication. You add it, then ask for the missing detail (venue/journal name, publication year, etc.)

## Important Guidelines
- **Never invent information.** Only use what the user explicitly tells you.
- **Citations:** Accept any citation format the user provides; clarify abbreviations if unclear
- **Dates:** Accept flexible formats and normalize (e.g. "2023–2024", "Summer 2023")
- **Research descriptions:** Help articulate research contributions and methodologies
- **Ask clarifying questions** when information is incomplete or ambiguous

## Available Sections
Research Interests, Education, Research Experience, Teaching Experience, Industry Experience, Publications, Manuscripts Under Review, Conference Presentations, Grants & Awards, Professional Service, Technical Skills, References.

## Tool Behavior
- For array fields: provide complete, well-formed structures
- Include required fields; optional fields can be omitted
- If you lack detail, ask questions first before making a tool call

Be conversational, encouraging, and help the user showcase their scholarly work effectively.`;
  } else {
    return `You are an expert cover letter writer helping professionals craft compelling, personalized cover letters.

## Your Role
Help the user write and refine their cover letter. Work conversationally to gather information and build each section.

## When the User Provides Information
1. **Extract all details** they mentioned
2. **Use the tools immediately** to update the letter
3. **Confirm what you added** in a brief message
4. **Ask one focused follow-up question** about missing details

Example: User mentions a company. You update the recipient info, then ask: "**Who is the hiring manager or what title should I address the letter to?**"

## Important Guidelines
- **Never invent information.** Only use what the user explicitly tells you.
- **Tone:** Professional, warm, and conversational (not stuffy)
- **Length:** Concise and impactful — 3–4 short paragraphs covering: why you're interested, relevant qualifications, why you're a fit, call to action
- **Personalization:** Encourage the user to reference specific company details, role requirements, and concrete examples
- **Ask clarifying questions** when information is vague or key details are missing

## Available Sections
Sender info (name, address), Recipient info (name, salutation, address), Body paragraphs, Date.

## Tool Behavior
- For sender/recipient address: provide address line objects
- For paragraphs: write clear, concise text
- If information is incomplete, ask a focused question before calling tools

Be conversational, encouraging, and help the user create a letter that stands out.`;
  }
}


export async function runAgentStream<TContent>(
  params: RunAgentStreamParams<TContent>
): Promise<void> {
  const {
    config,
    docType,
    getContent,
    onContentUpdate,
    history,
    userMessage,
    onTextChunk,
    onToolUse,
    onDone,
  } = params;
  const client = new OpenAI({
    apiKey: config.apiKey,
    baseURL: config.baseURL,
    dangerouslyAllowBrowser: true,
  });

  const tools = createTools(docType, getContent, onContentUpdate);
  const systemPrompt = buildSystemPrompt(docType);

  // Build tool definitions for OpenAI API
  const toolDefs = tools.map((tool) => ({
    type: "function" as const,
    function: {
      name: tool.name,
      description: tool.description,
      parameters: tool.schema ? zodToJsonSchema(tool.schema) : {},
    },
  }));

  // Build message history
  const apiMessages: ChatCompletionMessageParam[] = [
    { role: "system", content: systemPrompt },
    ...history.map((msg): ChatCompletionMessageParam => {
      if (msg.role === "user") {
        return { role: "user", content: msg.content };
      } else if (msg.role === "assistant") {
        return { role: "assistant", content: msg.content };
      } else {
        return {
          role: "tool",
          content: msg.content,
          tool_call_id: msg.toolCallId || "",
        };
      }
    }),
    { role: "user", content: userMessage },
  ];

  try {
    // Agent loop
    while (true) {
      // Create streaming completion
      const stream = await client.chat.completions.create({
        model: config.model,
        messages: apiMessages,
        tools: toolDefs.length > 0 ? toolDefs : undefined,
        tool_choice: toolDefs.length > 0 ? "auto" : undefined,
        stream: true,
      });

      let assistantContent = "";
      let toolCalls: Array<{
        id: string;
        type: "function";
        function: { name: string; arguments: string };
      }> = [];

      // Process stream
      for await (const chunk of stream) {
        const delta = chunk.choices[0]?.delta;
        if (!delta) continue;

        // Handle text content
        if (delta.content) {
          assistantContent += delta.content;
          onTextChunk(delta.content);
        }

        // Handle tool calls
        if (delta.tool_calls) {
          for (const toolCall of delta.tool_calls) {
            if (toolCall.index !== undefined) {
              if (!toolCalls[toolCall.index]) {
                toolCalls[toolCall.index] = {
                  id: toolCall.id || "",
                  type: "function",
                  function: { name: "", arguments: "" },
                };
              }
              if (toolCall.id) toolCalls[toolCall.index].id = toolCall.id;
              if (toolCall.function?.name)
                toolCalls[toolCall.index].function.name = toolCall.function.name;
              if (toolCall.function?.arguments)
                toolCalls[toolCall.index].function.arguments +=
                  toolCall.function.arguments;
            }
          }
        }
      }

      // Build assistant message: either with content only, or with content+tool_calls, or tool_calls only
      if (toolCalls.length > 0) {
        apiMessages.push({
          role: "assistant",
          content: assistantContent || null,
          tool_calls: toolCalls,
        } as any);

        // Execute tools
        for (const toolCall of toolCalls) {
          const tool = tools.find((t) => t.name === toolCall.function.name);
          if (!tool) continue;

          // Call onToolUse callback to notify UI of tool execution
          params.onToolUse?.(toolCall.function.name);

          try {
            const toolArgs = JSON.parse(toolCall.function.arguments);
            const result = await tool.func(toolArgs);

            apiMessages.push({
              role: "tool",
              content: String(result),
              tool_call_id: toolCall.id,
            });
          } catch (error) {
            apiMessages.push({
              role: "tool",
              content: `Error: ${error instanceof Error ? error.message : String(error)}`,
              tool_call_id: toolCall.id,
            });
          }
        }
      } else if (assistantContent) {
        // No tool calls, just text content
        apiMessages.push({
          role: "assistant",
          content: assistantContent,
        });
        // No more tool calls, agent is done
        break;
      } else {
        // No text and no tool calls — this shouldn't happen, but break anyway
        break;
      }
    }
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error("Agent stream failed");
  } finally {
    onDone();
  }
}

// Helper: Convert Zod schema to JSON schema for OpenAI
function zodToJsonSchema(schema: any): Record<string, unknown> {
  // Use Zod v4's native JSON schema converter
  if (!schema) return { type: "object" };

  try {
    // Zod v4 has built-in schema conversion that handles nested objects, arrays, optionals, etc.
    return (schema as any).toJSONSchema?.() ?? { type: "object" };
  } catch {
    return { type: "object" };
  }
}
