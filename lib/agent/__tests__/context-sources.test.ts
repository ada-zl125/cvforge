import { describe, expect, it } from "vitest";
import {
  buildContextInstructionContext,
  buildReferenceContext,
  prepareContextSourceText,
  truncateContextText,
  type AgentContextSource,
} from "@/lib/agent/context-sources";

describe("agent context sources", () => {
  it("cleans and truncates uploaded text", () => {
    expect(prepareContextSourceText(" Hello\r\nworld\u0000 ")).toBe("Hello\nworld");
    expect(truncateContextText("abcdef", 3)).toContain("[Context source truncated]");
  });

  it("builds a focused reference context for matching files", () => {
    const sources: AgentContextSource[] = [
      {
        id: "profile",
        type: "file",
        name: "profile.txt",
        text: "Ada built Python tools for data workflows.",
        createdAt: 1,
      },
      {
        id: "other",
        type: "file",
        name: "notes.txt",
        text: "This note is about gardening.",
        createdAt: 2,
      },
    ];

    const context = buildReferenceContext(sources, { query: "Python data", maxChunks: 1 });

    expect(context).toContain("profile.txt");
    expect(context).toContain("Python tools");
    expect(context).not.toContain("gardening");
  });

  it("separates project instructions from reference files", () => {
    const context = buildContextInstructionContext("Use concise British English.");

    expect(context).toContain("User project instructions");
    expect(context).toContain("Use concise British English.");
  });
});

