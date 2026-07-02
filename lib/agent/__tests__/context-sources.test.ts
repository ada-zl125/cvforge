import { describe, expect, it } from "vitest";
import {
  buildContextInstructionContext,
  buildReferenceContext,
  isSupportedDocumentFile,
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

  it("falls back to early source chunks when the query has no match", () => {
    const sources: AgentContextSource[] = [
      { id: "one", type: "file", name: "first.txt", text: "First useful note.", createdAt: 1 },
      { id: "two", type: "file", name: "second.txt", text: "Second useful note.", createdAt: 2 },
    ];

    const context = buildReferenceContext(sources, { query: "quantum banana", maxChunks: 1 });

    expect(context).toContain("first.txt");
    expect(context).toContain("First useful note.");
    expect(context).not.toContain("second.txt");
  });

  it("keeps reference context within the requested character budget", () => {
    const sources: AgentContextSource[] = [
      { id: "long", type: "file", name: "long.txt", text: "Alpha ".repeat(200), createdAt: 1 },
    ];

    const context = buildReferenceContext(sources, { maxChars: 180, maxChunks: 3 });

    expect(context).toContain("long.txt");
    expect(context).toContain("[Context chunk truncated]");
    expect(context?.match(/Alpha/g)?.length).toBeLessThan(30);
  });

  it("separates project instructions from reference files", () => {
    const context = buildContextInstructionContext("Use concise British English.");

    expect(context).toContain("User project instructions");
    expect(context).toContain("Use concise British English.");
  });

  it("accepts only supported document file extensions", () => {
    expect(isSupportedDocumentFile(new File(["hello"], "notes.md"))).toBe(true);
    expect(isSupportedDocumentFile(new File(["hello"], "archive.docx"))).toBe(false);
  });
});
