import { describe, expect, it } from "vitest";
import type { AgentChange } from "@/lib/agent/change-tracking";
import { getReviewSnippets } from "@/lib/agent/review-highlighting";

function change(before: unknown, after: unknown): AgentChange {
  return {
    id: "change",
    before,
    after,
    beforeSignature: "before",
    afterSignature: "after",
    addedWords: 1,
    removedWords: 1,
    toolNames: ["set_experience"],
  };
}

describe("review highlighting", () => {
  it("falls back to index matching when tool calls recreate item ids", () => {
    const before = {
      experience: [
        {
          id: "google-old",
          company: "Google",
          position: "AI Engineer",
          descriptions: [{ id: "g1", value: "Built AI tools." }],
        },
        {
          id: "microsoft-old",
          company: "Microsoft",
          position: "Machine Learning Engineer",
          descriptions: [{ id: "m1", value: "Built ML pipelines." }],
        },
      ],
    };
    const after = {
      experience: [
        {
          id: "google-new",
          company: "Google",
          position: "AI Engineer",
          descriptions: [{ id: "g2", value: "Built scalable AI tools." }],
        },
        {
          id: "microsoft-new",
          company: "Microsoft",
          position: "Machine Learning Engineer",
          descriptions: [{ id: "m2", value: "Built ML pipelines." }],
        },
      ],
    };

    const snippets = getReviewSnippets(change(before, after));

    expect(snippets.map((snippet) => snippet.text)).toContain("Built scalable AI tools.");
    expect(snippets.map((snippet) => snippet.text)).not.toContain("Built ML pipelines.");
  });

  it("adds anchors so repeated text is reviewed in the right section", () => {
    const before = {
      summary: "AI Engineer with practical experience.",
      experience: [{ id: "google", company: "Google", position: "Engineer" }],
    };
    const after = {
      summary: "AI Engineer with practical experience.",
      experience: [{ id: "google", company: "Google", position: "AI Engineer" }],
    };

    const snippet = getReviewSnippets(change(before, after)).find((item) => item.text === "AI Engineer");

    expect(snippet?.anchors).toContain("Google");
  });

  it("keeps local anchors when the document has long unrelated text", () => {
    const before = {
      summary: "AI Engineer with production machine learning experience. ".repeat(8),
      education: [{ institution: "University of Oxford", degree: "MSc in Advanced Computer Science" }],
      experience: [
        {
          id: "google-old",
          company: "Google",
          position: "AI Engineer",
          location: "London, UK",
          descriptions: [{ id: "g1", value: "Built AI tools." }],
        },
        {
          id: "microsoft-old",
          company: "Microsoft",
          position: "Machine Learning Engineer",
          descriptions: [{ id: "m1", value: "Built ML pipelines." }],
        },
      ],
    };
    const after = {
      ...before,
      experience: [
        {
          id: "google-new",
          company: "Google",
          position: "AI Engineer",
          location: "London, UK",
          descriptions: [{ id: "g2", value: "Built scalable AI services." }],
        },
        {
          id: "microsoft-new",
          company: "Microsoft",
          position: "Machine Learning Engineer",
          descriptions: [{ id: "m2", value: "Built ML pipelines." }],
        },
      ],
    };

    const snippets = getReviewSnippets(change(before, after));
    const googleSnippet = snippets.find((item) => item.text === "Built scalable AI services.");

    expect(googleSnippet?.anchors).toContain("Google");
    expect(snippets.map((snippet) => snippet.text)).not.toContain("Built ML pipelines.");
  });
});
