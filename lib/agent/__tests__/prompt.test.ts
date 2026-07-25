import { describe, expect, it } from "vitest";
import { buildSystemPrompt } from "@/lib/agent/chat";

describe("agent system prompt", () => {
  it("uses one concise policy for every document type", () => {
    const prompts = [
      buildSystemPrompt("resume", "en"),
      buildSystemPrompt("academic-cv", "en"),
      buildSystemPrompt("cover-letter", "en"),
    ];
    const normalizeDocumentType = (prompt: string) =>
      prompt.replace(/professional (resume|academic-cv|cover-letter) editor/, "professional document editor");

    expect(prompts.map(normalizeDocumentType)).toEqual([
      normalizeDocumentType(prompts[0]),
      normalizeDocumentType(prompts[0]),
      normalizeDocumentType(prompts[0]),
    ]);
    expect(prompts[0].length).toBeLessThan(4000);
  });

  it("contains general policies without case examples", () => {
    const prompt = buildSystemPrompt("resume", "zh");

    expect(prompt).toContain("Instruction priority");
    expect(prompt).toContain("Prefer an accurate partial result");
    expect(prompt).toContain("one missing or ambiguous detail is necessary");
    expect(prompt).toContain("Array setters replace their section");
    expect(prompt).not.toMatch(/\be\.g\.|\bfor example\b|\bsuch as\b|\bexample flow\b/i);
  });
});
