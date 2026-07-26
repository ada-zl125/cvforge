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

  it("preserves proper nouns while normalising Chinese punctuation", () => {
    const args = normalizeToolArgsForDocumentLanguage({
      institution: "Example Institute",
      location: "Example City, Example Country",
      description: "负责平台，提升可靠性。",
    }, "zh");

    expect(args).toEqual({
      institution: "Example Institute",
      location: "Example City, Example Country",
      description: "负责平台, 提升可靠性。",
    });
  });
});
