import { describe, expect, it } from "vitest";
import {
  normalizeAssistantText,
  normalizeToolArgsForDocumentLanguage,
} from "@/lib/agent/text-normalization";

describe("agent text normalisation", () => {
  it("normalises assistant punctuation for English replies", () => {
    expect(normalizeAssistantText("- Built tools -> shipped features", "en")).toBe(
      "* Built tools to shipped features"
    );
  });

  it("normalises known Chinese document values", () => {
    const args = normalizeToolArgsForDocumentLanguage({
      institution: "Imperial College London",
      location: "London, UK",
    }, "zh");

    expect(args).toEqual({
      institution: "伦敦帝国理工学院",
      location: "英国, 伦敦",
    });
  });
});

