import { beforeEach, describe, expect, it, vi } from "vitest";
import { FakeToolCallingModel } from "langchain";
import type { ResumeContent } from "@/lib/types/resume";

const modelState = vi.hoisted(() => ({
  current: null as unknown,
  creations: 0,
}));

const backendState = vi.hoisted(() => ({
  overrides: [] as boolean[],
}));

vi.mock("@/lib/agent/model", () => ({
  createAgentChatModel: () => {
    modelState.creations += 1;
    return modelState.current;
  },
}));

vi.mock("deepagents/browser", async (importOriginal) => {
  const original = await importOriginal<typeof import("deepagents/browser")>();
  return {
    ...original,
    createDeepAgent: (
      options: Parameters<typeof original.createDeepAgent>[0]
    ) => {
      backendState.overrides.push(
        Object.prototype.hasOwnProperty.call(options, "backend")
      );
      return original.createDeepAgent(options);
    },
  };
});

import {
  createAgentSessionId,
  discardAgentResume,
  resumeAgentStream,
  runAgentStream,
  type RunAgentStreamParams,
} from "@/lib/agent/chat";

function createResume(): ResumeContent {
  return {
    personal: {
      fullName: "",
      contacts: [],
    },
    sections: ["summary", "skills"],
    experience: [],
    education: [],
    skills: [],
    projects: [],
    awards: [],
  };
}

function createParams(
  content: ResumeContent,
  onUpdate: (updated: ResumeContent, toolName: string) => void
): RunAgentStreamParams<ResumeContent> {
  return {
    sessionId: createAgentSessionId(),
    config: {
      apiKey: "test-key",
      baseURL: "https://example.test/v1",
      model: "test-model",
      thinkingEnabled: false,
    },
    docType: "resume",
    documentLanguage: "en",
    getContent: () => content,
    onContentUpdate: onUpdate,
    history: [],
    userMessage: "Update my resume",
    onTextChunk: () => undefined,
    onDone: () => undefined,
  };
}

describe("Deep Agent runtime", () => {
  beforeEach(() => {
    modelState.current = null;
    modelState.creations = 0;
    backendState.overrides = [];
  });

  it("executes document tools through graph state", async () => {
    modelState.current = new FakeToolCallingModel({
      toolCalls: [
        [
          {
            name: "set_summary",
            args: { text: "Product engineer focused on reliable systems." },
            id: "summary-call",
          },
        ],
        [],
      ],
    });
    let content = createResume();
    const toolNames: string[] = [];

    await runAgentStream(
      createParams(content, (updated, toolName) => {
        content = updated;
        toolNames.push(toolName);
      })
    );

    expect(content.summary).toBe(
      "Product engineer focused on reliable systems."
    );
    expect(toolNames).toEqual(["set_summary"]);
    expect(backendState.overrides).toEqual([false]);
  });

  it("merges parallel document tools into the latest graph state", async () => {
    modelState.current = new FakeToolCallingModel({
      toolCalls: [
        [
          {
            name: "set_summary",
            args: { text: "Full stack engineer." },
            id: "summary-call",
          },
          {
            name: "set_skills",
            args: {
              items: [
                {
                  category: "Languages",
                  items: "TypeScript, Python",
                },
              ],
            },
            id: "skills-call",
          },
        ],
        [],
      ],
    });
    let content = createResume();
    const toolNames: string[] = [];

    await runAgentStream(
      createParams(content, (updated, toolName) => {
        content = updated;
        toolNames.push(toolName);
      })
    );

    expect(content.summary).toBe("Full stack engineer.");
    expect(content.skills).toHaveLength(1);
    expect(content.skills[0].items).toBe("TypeScript, Python");
    expect(toolNames).toEqual(["set_summary", "set_skills"]);
  });

  it("prioritizes clarification and makes no document change before resume", async () => {
    modelState.current = new FakeToolCallingModel({
      toolCalls: [
        [
          {
            name: "ask_user",
            args: {
              question: "Which role should the summary target?",
              reason: "The requested target is ambiguous.",
              section: "summary",
            },
            id: "clarification-call",
          },
        ],
        [
          {
            name: "set_summary",
            args: { text: "Software engineer targeting platform roles." },
            id: "resolved-summary-call",
          },
        ],
        [],
      ],
    });
    let content = createResume();
    const toolNames: string[] = [];
    let resumeToken: string | undefined;

    await runAgentStream({
      ...createParams(content, (updated, toolName) => {
        content = updated;
        toolNames.push(toolName);
      }),
      onClarification: (_request, token) => {
        resumeToken = token;
      },
    });

    expect(resumeToken).toBeTruthy();
    expect(content.summary).toBeUndefined();
    expect(toolNames).toEqual([]);

    const resumed = await resumeAgentStream({
      resumeToken: resumeToken!,
      answer: "Platform engineering",
      currentContent: content,
      onContentUpdate: (updated, toolName) => {
        content = updated;
        toolNames.push(toolName);
      },
      onTextChunk: () => undefined,
      onDone: () => undefined,
    });

    expect(resumed).toBe(true);
    expect(content.summary).toBe(
      "Software engineer targeting platform roles."
    );
    expect(toolNames).toEqual(["set_summary"]);
    discardAgentResume(resumeToken);
  });

  it("retrieves uploaded references through the virtual filesystem", async () => {
    modelState.current = new FakeToolCallingModel({
      toolCalls: [
        [
          {
            name: "read_file",
            args: {
              file_path: "/references/1-profile.md.txt",
            },
            id: "read-reference-call",
          },
        ],
        [],
      ],
    });
    const content = createResume();
    let finalText = "";

    await runAgentStream({
      ...createParams(content, () => undefined),
      referenceSources: [
        {
          id: "profile",
          type: "file",
          name: "profile.md",
          text: "REFERENCE_ONLY_FACT_8472",
          createdAt: 1,
        },
      ],
      onTextChunk: (text) => {
        finalText += text;
      },
    });

    expect(finalText).toContain("REFERENCE_ONLY_FACT_8472");
  });

  it("reads an uploaded CV before applying a follow-up education update", async () => {
    modelState.current = new FakeToolCallingModel({
      toolCalls: [
        [
          {
            name: "read_file",
            args: {
              file_path: "/references/1-profile.pdf.txt",
            },
            id: "read-cv-call",
          },
        ],
        [
          {
            name: "set_education",
            args: {
              items: [
                {
                  institution: "Imperial College London",
                  degree: "MSc",
                  field:
                    "Applied Computational Science and Engineering",
                  location: "London",
                  startDate: "2021/09",
                  endDate: "2025/06",
                },
              ],
            },
            id: "update-education-call",
          },
        ],
        [],
      ],
    });
    let content = createResume();
    const toolNames: string[] = [];

    await runAgentStream({
      ...createParams(content, (updated, toolName) => {
        content = updated;
        toolNames.push(toolName);
      }),
      userMessage: "地点正确, 2021/09 - 2025/06, 帮我更新",
      referenceSources: [
        {
          id: "profile",
          type: "file",
          name: "profile.pdf",
          text:
            "Imperial College London, MSc, Applied Computational Science and Engineering, London",
          createdAt: 1,
        },
      ],
    });

    expect(toolNames).toEqual(["set_education"]);
    expect(content.education).toEqual([
      expect.objectContaining({
        institution: "Imperial College London",
        startDate: "2021/09",
        endDate: "2025/06",
      }),
    ]);
  });

  it("reuses one Deep Agent runtime across conversation turns", async () => {
    modelState.current = new FakeToolCallingModel({
      toolCalls: [
        [
          {
            name: "set_summary",
            args: { text: "Platform engineer." },
            id: "summary-call",
          },
        ],
        [],
        [
          {
            name: "set_skills",
            args: {
              items: [{ category: "Languages", items: "TypeScript" }],
            },
            id: "skills-call",
          },
        ],
        [],
      ],
    });
    let content = createResume();
    const sessionId = createAgentSessionId();
    const onUpdate = (updated: ResumeContent) => {
      content = updated;
    };

    await runAgentStream({
      ...createParams(content, onUpdate),
      sessionId,
      userMessage: "Update the summary",
    });
    await runAgentStream({
      ...createParams(content, onUpdate),
      sessionId,
      history: [
        { role: "user", content: "Update the summary" },
        { role: "assistant", content: "Updated." },
      ],
      userMessage: "Update the skills",
    });

    expect(modelState.creations).toBe(1);
    expect(content.summary).toBe("Platform engineer.");
    expect(content.skills).toEqual([
      expect.objectContaining({
        category: "Languages",
        items: "TypeScript",
      }),
    ]);
    discardAgentResume(sessionId);
  });
});
