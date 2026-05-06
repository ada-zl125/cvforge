"use client";

import OpenAI from "openai";
import type {
  ChatCompletionAssistantMessageParam,
  ChatCompletionMessageParam,
  ChatCompletionMessageToolCall,
} from "openai/resources/chat/completions";
import resumeExampleEn from "@/examples/resume-example-en.json";
import resumeExampleCn from "@/examples/resume-example-cn.json";
import academicCvExampleEn from "@/examples/academic-cv-example-en.json";
import academicCvExampleCn from "@/examples/academic-cv-example-cn.json";
import coverLetterExampleEn from "@/examples/cover-letter-example-en.json";
import { createTools, type DocType } from "./tools";
import type { LLMConfig } from "./config";

export interface Message {
  role: "user" | "assistant";
  content: string;
  kind?: "context-summary";
}

export type AgentStatus = "thinking" | "working";

export interface AgentContextUsage {
  usedTokens: number;
  maxTokens: number;
  percent: number;
}

interface RunAgentStreamParams<TContent> {
  config: LLMConfig;
  docType: DocType;
  getContent: () => TContent;
  onContentUpdate: (updated: TContent, toolName: string) => void;
  history: Message[];
  userMessage: string;
  onTextChunk: (chunk: string) => void;
  onStatusChange?: (status: AgentStatus | null) => void;
  onDone: () => void;
}

const MAX_AGENT_LOOPS = 6;
const DOCUMENT_CONTEXT_MAX_CHARS = 12000;
const COMPACT_TRANSCRIPT_MAX_CHARS = 16000;

const DEFAULT_CONTEXT_WINDOW_TOKENS = 128000;
const EXAMPLE_CONTEXT_MAX_CHARS = 6000;

const MODEL_CONTEXT_WINDOWS: Array<[RegExp, number]> = [
  [/gpt-4\.1|gpt-4o|o3|o4|gpt-5/i, 128000],
  [/claude-3\.7|claude-3-7|claude-3\.5|claude-3-5|claude-3/i, 200000],
  [/gemini-1\.5|gemini-2/i, 1000000],
  [/deepseek/i, 128000],
  [/qwen/i, 128000],
  [/llama/i, 128000],
  [/mistral/i, 128000],
];

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
- **Do not guess missing fields just to satisfy a tool schema.** If a field is unknown, pass an empty string or omit it when allowed, then ask one focused follow-up question.
- **Location precision:** if a location can be inferred with high confidence from a well-known institution/company/place name, use the full project style (English: "City, Country/Region", e.g. "London, UK"; Chinese: "国家, 城市", e.g. "中国, 北京"). If confidence is not high, leave the location empty and ask.
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
- When adding an entry with partial information, keep unknown optional details blank instead of inventing them. Example: school known but degree/date unknown -> set institution and any high-confidence location, leave degree/dates empty, then ask for the most important missing detail.
- When you need tools, call them first without narrating the tool execution. After all tools finish, respond with a concise result for the user.
- Always reply to the user after each request. Keep final replies short, clear, and useful: usually 1-2 sentences unless the user asks for detail.

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
- **Do not guess missing fields just to satisfy a tool schema.** If a field is unknown, pass an empty string or omit it when allowed, then ask one focused follow-up question.
- **Location precision:** if a location can be inferred with high confidence from a well-known institution/conference/place name, use the full project style (English: "City, Country/Region", e.g. "Oxford, UK"; Chinese: "国家, 城市", e.g. "中国, 北京"). If confidence is not high, leave the location empty and ask.
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
- When adding an entry with partial information, keep unknown optional details blank instead of inventing them. Example: institution known but dates/degree unknown -> set the institution and any high-confidence location, leave missing fields empty, then ask for the most important missing detail.
- When you need tools, call them first without narrating the tool execution. After all tools finish, respond with a concise result for the user.
- Always reply to the user after each request. Keep final replies short, clear, and useful: usually 1-2 sentences unless the user asks for detail.

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
- **Do not guess missing sender, recipient, address, or role details.** If unknown, omit the field or leave it blank, then ask one focused follow-up question.
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
- When you need tools, call them first without narrating the tool execution. After all tools finish, respond with a concise result for the user.
- Always reply to the user after each request. Keep final replies short, clear, and useful: usually 1-2 sentences unless the user asks for detail.

Be conversational, encouraging, and help the user create a letter that stands out.`;
  }
}

function isLikelyChinese(text: string): boolean {
  return /[\u3400-\u9fff]/.test(text);
}

function toolLabel(toolName: string, zh: boolean): string {
  const labels: Record<string, { en: string; zh: string }> = {
    update_personal: { en: "personal information", zh: "个人信息" },
    update_sender: { en: "sender information", zh: "发件人信息" },
    update_recipient: { en: "recipient information", zh: "收件人信息" },
    set_summary: { en: "summary", zh: "个人简介" },
    set_education: { en: "education", zh: "教育经历" },
    set_experience: { en: "experience", zh: "工作经历" },
    set_skills: { en: "skills", zh: "技能" },
    set_projects: { en: "projects", zh: "项目经历" },
    set_awards: { en: "awards", zh: "荣誉奖项" },
    set_research_interests: { en: "research interests", zh: "研究兴趣" },
    set_research_experience: { en: "research experience", zh: "研究经历" },
    set_teaching_experience: { en: "teaching experience", zh: "教学经历" },
    set_industry_experience: { en: "industry experience", zh: "行业经历" },
    set_publications: { en: "publications", zh: "发表论文" },
    set_manuscripts_under_review: { en: "manuscripts under review", zh: "审稿中论文" },
    set_conference_presentations: { en: "conference presentations", zh: "会议展示" },
    set_grants_and_awards: { en: "grants and awards", zh: "基金与奖项" },
    set_professional_service: { en: "professional service", zh: "学术服务" },
    set_technical_skills: { en: "technical skills", zh: "技术技能" },
    set_references: { en: "references", zh: "推荐人" },
    set_paragraphs: { en: "body paragraphs", zh: "正文段落" },
    set_date: { en: "date", zh: "日期" },
  };

  const fallback = toolName.replace(/^set_|^update_/, "").replaceAll("_", " ");
  return labels[toolName]?.[zh ? "zh" : "en"] ?? fallback;
}

function buildFallbackCompletion(toolNames: string[], userMessage: string): string {
  const zh = isLikelyChinese(userMessage);
  const uniqueToolNames = Array.from(new Set(toolNames));
  const changed = uniqueToolNames.map((name) => toolLabel(name, zh)).join(zh ? "、" : ", ");

  if (zh) return changed ? `已完成，已更新${changed}。` : "已完成更新。";
  return changed ? `Done. I updated your ${changed}.` : "Done. I updated the document.";
}

function buildNoResponseFallback(userMessage: string): string {
  return isLikelyChinese(userMessage)
    ? "我这次没有生成有效回复，请再试一次。"
    : "I could not generate a useful reply. Please try again.";
}

function buildToolFailureFallback(userMessage: string): string {
  return isLikelyChinese(userMessage)
    ? "我没能完成这次更新，请检查信息后再试一次。"
    : "I could not complete that update. Please check the details and try again.";
}

function compactDocumentValue(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value
      .map(compactDocumentValue)
      .filter((item) => {
        if (item === null || item === undefined) return false;
        if (Array.isArray(item)) return item.length > 0;
        if (typeof item === "object") return Object.keys(item).length > 0;
        return item !== "";
      });
  }

  if (value && typeof value === "object") {
    const compacted: Record<string, unknown> = {};

    for (const [key, nestedValue] of Object.entries(value)) {
      if (key === "id") continue;
      if (key === "photo") {
        compacted.photo = "[photo omitted]";
        continue;
      }

      const compactedValue = compactDocumentValue(nestedValue);
      if (compactedValue === null || compactedValue === undefined) continue;
      if (Array.isArray(compactedValue) && compactedValue.length === 0) continue;
      if (typeof compactedValue === "object" && Object.keys(compactedValue).length === 0) continue;
      if (compactedValue === "") continue;
      compacted[key] = compactedValue;
    }

    return compacted;
  }

  return value;
}

function buildDocumentContext(docType: DocType, content: unknown): string {
  const serialized = JSON.stringify(compactDocumentValue(content), null, 2);
  const safeSerialized =
    serialized.length > DOCUMENT_CONTEXT_MAX_CHARS
      ? `${serialized.slice(0, DOCUMENT_CONTEXT_MAX_CHARS)}\n... [truncated]`
      : serialized;

  return `Current ${docType} state, including edits the user may have made outside chat. Treat this as the source of truth when answering or calling tools:\n${safeSerialized}`;
}

function inferExampleLanguage(content: unknown, userMessage?: string): "en" | "zh" {
  const text = `${JSON.stringify(compactDocumentValue(content))} ${userMessage ?? ""}`;
  return isLikelyChinese(text) ? "zh" : "en";
}

function pickExample(docType: DocType, language: "en" | "zh"): unknown {
  if (docType === "resume") {
    return language === "zh" ? resumeExampleCn : resumeExampleEn;
  }
  if (docType === "academic-cv") {
    return language === "zh" ? academicCvExampleCn : academicCvExampleEn;
  }
  return coverLetterExampleEn;
}

function buildExampleStyleContext(docType: DocType, content: unknown, userMessage?: string): string {
  const language = inferExampleLanguage(content, userMessage);
  const example = pickExample(docType, language);
  const compactExample = JSON.stringify(compactDocumentValue(example), null, 2);
  const safeExample =
    compactExample.length > EXAMPLE_CONTEXT_MAX_CHARS
      ? `${compactExample.slice(0, EXAMPLE_CONTEXT_MAX_CHARS)}\n... [example truncated]`
      : compactExample;

  const languageRules =
    language === "zh"
      ? `Chinese document style:
- Use Chinese section content and Chinese date style from examples, e.g. "2024/09" and "至今".
- Use location order "国家, 城市" for location fields, e.g. "中国, 北京" or "美国, 新奥尔良".
- Use concise Chinese labels such as "成绩", "获奖", "研究方向" when creating extra fields.
- Keep English technical terms when they are normally written in English, such as Python, FastAPI, RAG, GitHub.`
      : `English document style:
- Use English section content and English date style from examples, e.g. "Sept 2023" and "Present".
- Use location order "City, Country/Region" for location fields, e.g. "London, UK" or "Oxford, UK".
- Use concise English labels such as "Grade", "Awards", "Research Field" when creating extra fields.
- Keep bullet points action-oriented and concrete.`;

  return `Project example reference for formatting only. Follow its field shapes, date style, location order, labels, and writing density. Do not copy personal/example facts unless the user explicitly asks.

${languageRules}

Missing information policy:
- Prefer partial-but-accurate updates over fabricated complete entries.
- If a tool field is unknown, omit it when optional or use an empty string.
- Ask one focused follow-up question for the most important missing detail.
- You may infer common public facts only when highly confident and specific. For example, "Imperial College London" -> "London, UK"; avoid vague values like "UK" when the city is knowable.

Example JSON reference:
${safeExample}`;
}

function estimateTokens(text: string): number {
  if (!text) return 0;

  const cjkChars = text.match(/[\u3400-\u9fff]/g)?.length ?? 0;
  const nonCjkChars = text.length - cjkChars;

  return Math.ceil(cjkChars * 1.2 + nonCjkChars / 4);
}

function getModelContextWindow(model: string): number {
  const matched = MODEL_CONTEXT_WINDOWS.find(([pattern]) => pattern.test(model));
  return matched?.[1] ?? DEFAULT_CONTEXT_WINDOW_TOKENS;
}

export function estimateAgentContextUsage<TContent>({
  model,
  docType,
  content,
  history,
}: {
  model: string;
  docType: DocType;
  content: TContent;
  history: Message[];
}): AgentContextUsage {
  const serializedHistory = history
    .map((message) => {
      const role =
        message.kind === "context-summary"
          ? "system compacted context"
          : message.role;
      return `${role}: ${message.content}`;
    })
    .join("\n\n");
  const contextText = [
    buildSystemPrompt(docType),
    buildDocumentContext(docType, content),
    buildExampleStyleContext(docType, content),
    serializedHistory,
  ].join("\n\n");
  const usedTokens = estimateTokens(contextText) + history.length * 6 + 256;
  const maxTokens = getModelContextWindow(model);
  const percent = Math.min(100, Math.max(0, Math.ceil((usedTokens / maxTokens) * 100)));

  return {
    usedTokens,
    maxTokens,
    percent,
  };
}

function buildCompactTranscript(history: Message[]): string {
  const transcript = history
    .map((message) => {
      const label =
        message.kind === "context-summary"
          ? "Compacted context"
          : message.role === "user"
            ? "User"
            : "Assistant";
      return `${label}:\n${message.content.trim()}`;
    })
    .join("\n\n");

  if (transcript.length <= COMPACT_TRANSCRIPT_MAX_CHARS) return transcript;

  return `[Earlier conversation omitted]\n${transcript.slice(-COMPACT_TRANSCRIPT_MAX_CHARS)}`;
}

export async function compactAgentHistory<TContent>({
  config,
  docType,
  content,
  history,
}: {
  config: LLMConfig;
  docType: DocType;
  content: TContent;
  history: Message[];
}): Promise<string> {
  const transcript = buildCompactTranscript(history);
  const zh = isLikelyChinese(transcript);
  const client = new OpenAI({
    apiKey: config.apiKey,
    baseURL: config.baseURL,
    dangerouslyAllowBrowser: true,
  });

  const completion = await client.chat.completions.create({
    model: config.model,
    messages: [
      {
        role: "system",
        content: `You compress conversation context for a resume/CV/cover-letter editing agent.

Write a compact memory note for future turns. Preserve only information that helps the next agent continue the work:
- User goals, constraints, preferences, and requested writing style
- Important facts the user supplied
- Decisions already made and document changes already completed
- Open questions, pending tasks, and things the agent must avoid

Do not include greetings, generic encouragement, tool chatter, or redundant details already obvious from the current document state. Use concise markdown bullets. Keep it under 1200 words. Reply in ${zh ? "Chinese" : "English"}.`,
      },
      {
        role: "system",
        content: buildDocumentContext(docType, content),
      },
      {
        role: "user",
        content: `Compress this conversation into durable context for the next agent turn:\n\n${transcript}`,
      },
    ],
  });

  const summary = completion.choices[0]?.message.content?.trim();
  if (summary) return summary;

  return zh
    ? "已压缩此前对话：保留用户提供的重要信息、已完成修改、偏好和待处理事项。"
    : "Compacted prior conversation: preserved key user facts, completed changes, preferences, and pending items.";
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
    onStatusChange,
    onDone,
  } = params;
  const client = new OpenAI({
    apiKey: config.apiKey,
    baseURL: config.baseURL,
    dangerouslyAllowBrowser: true,
  });

  const tools = createTools(docType, getContent, onContentUpdate);
  const systemPrompt = buildSystemPrompt(docType);
  const documentContext = buildDocumentContext(docType, getContent());
  const exampleStyleContext = buildExampleStyleContext(docType, getContent(), userMessage);

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
    { role: "system", content: documentContext },
    { role: "system", content: exampleStyleContext },
    ...history.map((msg): ChatCompletionMessageParam => {
      if (msg.kind === "context-summary") {
        return {
          role: "system",
          content: `Compacted conversation context from earlier chat. Use this as durable memory, not as a new user request:\n${msg.content}`,
        };
      }

      if (msg.role === "user") {
        return { role: "user", content: msg.content };
      }
      return { role: "assistant", content: msg.content };
    }),
    { role: "user", content: userMessage },
  ];

  try {
    const successfulToolNames: string[] = [];
    const failedToolNames: string[] = [];
    let emittedFinalText = false;

    // Agent loop
    for (let loopCount = 0; loopCount < MAX_AGENT_LOOPS; loopCount += 1) {
      onStatusChange?.(successfulToolNames.length > 0 ? "working" : "thinking");

      // Create streaming completion
      const stream = await client.chat.completions.create({
        model: config.model,
        messages: apiMessages,
        tools: toolDefs.length > 0 ? toolDefs : undefined,
        tool_choice: toolDefs.length > 0 ? "auto" : undefined,
        stream: true,
      });

      let assistantContent = "";
      const toolCalls: ChatCompletionMessageToolCall[] = [];

      // Process stream
      for await (const chunk of stream) {
        const delta = chunk.choices[0]?.delta;
        if (!delta) continue;

        // Handle text content
        if (delta.content) {
          assistantContent += delta.content;
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
      const completeToolCalls = toolCalls.filter(
        (toolCall) =>
          toolCall?.id &&
          toolCall.function.name &&
          toolCall.function.arguments
      );

      if (completeToolCalls.length > 0) {
        onStatusChange?.("working");

        const assistantMessage: ChatCompletionAssistantMessageParam = {
          role: "assistant",
          content: assistantContent || null,
          tool_calls: completeToolCalls,
        };
        apiMessages.push(assistantMessage);

        // Execute tools
        for (const toolCall of completeToolCalls) {
          const tool = tools.find((t) => t.name === toolCall.function.name);
          if (!tool) {
            failedToolNames.push(toolCall.function.name);
            apiMessages.push({
              role: "tool",
              content: `Error: Unknown tool ${toolCall.function.name}`,
              tool_call_id: toolCall.id,
            });
            continue;
          }

          try {
            const toolArgs = JSON.parse(toolCall.function.arguments);
            const result = await tool.func(toolArgs);
            successfulToolNames.push(toolCall.function.name);

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
            failedToolNames.push(toolCall.function.name);
          }
        }
      } else if (assistantContent) {
        onStatusChange?.(null);
        onTextChunk(assistantContent);
        emittedFinalText = true;

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

    if (!emittedFinalText && successfulToolNames.length > 0) {
      onStatusChange?.(null);
      onTextChunk(buildFallbackCompletion(successfulToolNames, userMessage));
    } else if (!emittedFinalText && failedToolNames.length > 0) {
      onStatusChange?.(null);
      onTextChunk(buildToolFailureFallback(userMessage));
    } else if (!emittedFinalText) {
      onStatusChange?.(null);
      onTextChunk(buildNoResponseFallback(userMessage));
    }
  } catch (error) {
    onStatusChange?.(null);
    if (error instanceof Error) {
      throw error;
    }
    throw new Error("Agent stream failed");
  } finally {
    onStatusChange?.(null);
    onDone();
  }
}

// Helper: Convert Zod schema to JSON schema for OpenAI
function zodToJsonSchema(schema: unknown): Record<string, unknown> {
  // Use Zod v4's native JSON schema converter
  if (!schema) return { type: "object" };

  try {
    // Zod v4 has built-in schema conversion that handles nested objects, arrays, optionals, etc.
    const convertible = schema as { toJSONSchema?: () => Record<string, unknown> };
    return convertible.toJSONSchema?.() ?? { type: "object" };
  } catch {
    return { type: "object" };
  }
}
