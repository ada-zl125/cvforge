import { describe, expect, it } from "vitest";
import {
  buildContextInstructionContext,
  buildReferenceContext,
  isSupportedDocumentFile,
  prepareContextSourceText,
  truncateContextSourceName,
  truncateContextText,
  type AgentContextSource,
} from "@/lib/agent/context-sources";

describe("agent context sources", () => {
  it("cleans and truncates uploaded text", () => {
    expect(prepareContextSourceText(" Hello\r\nworld\u0000 ")).toBe("Hello\nworld");
    expect(truncateContextText("abcdef", 3)).toContain("[Context source truncated]");
  });

  it("truncates long source names without losing the file extension", () => {
    const name = "a-very-long-context-source-file-name-for-a-role.pdf";
    const truncated = truncateContextSourceName(name, 24);

    expect(Array.from(truncated)).toHaveLength(24);
    expect(truncated).toBe("a-very-long-context….pdf");
    expect(truncated.endsWith(".pdf")).toBe(true);
    expect(truncateContextSourceName("notes.md", 24)).toBe("notes.md");
  });

  it("builds a reference manifest without injecting file contents", () => {
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

    const context = buildReferenceContext(sources);

    expect(context).toContain("profile.txt");
    expect(context).toContain("notes.txt");
    expect(context).toContain("local virtual filesystem");
    expect(context).not.toContain("Python tools");
    expect(context).not.toContain("gardening");
  });

  it("omits the reference manifest when no files are available", () => {
    expect(buildReferenceContext()).toBeNull();
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
