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

  it("tracks changed date ranges with nearby anchors", () => {
    const before = {
      experience: [{
        id: "google",
        company: "Google",
        position: "AI Engineer",
        startDate: "Jan 2024",
        endDate: "Jun 2025",
      }],
    };
    const after = {
      experience: [{
        id: "google",
        company: "Google",
        position: "AI Engineer",
        startDate: "Jan 2024",
        endDate: "Present",
      }],
    };

    const snippet = getReviewSnippets(change(before, after)).find((item) => item.text === "Jan 2024 – Present");

    expect(snippet?.anchors).toEqual(expect.arrayContaining(["Google", "AI Engineer"]));
  });

  it("matches regenerated items after date sorting without false highlights", () => {
    const before = {
      experience: [
        {
          id: "alpha-old",
          company: "Alpha",
          position: "Engineer",
          startDate: "2024",
          endDate: "2025",
          descriptions: [{ id: "a-old", value: "Built platform tools." }],
        },
        {
          id: "beta-old",
          company: "Beta",
          position: "Developer",
          startDate: "2022",
          endDate: "2023",
          descriptions: [{ id: "b-old", value: "Built data services." }],
        },
      ],
    };
    const after = {
      experience: [
        {
          id: "beta-new",
          company: "Beta",
          position: "Developer",
          startDate: "2022",
          endDate: "Present",
          descriptions: [{ id: "b-new", value: "Built data services." }],
        },
        {
          id: "alpha-new",
          company: "Alpha",
          position: "Engineer",
          startDate: "2024",
          endDate: "2025",
          descriptions: [{ id: "a-new", value: "Built platform tools." }],
        },
      ],
    };

    const snippets = getReviewSnippets(change(before, after));
    const texts = snippets.map((snippet) => snippet.text);

    expect(texts).toEqual(expect.arrayContaining(["2022 – Present", "Present"]));
    [
      "Alpha",
      "Beta",
      "Engineer",
      "Developer",
      "Built platform tools.",
      "Built data services.",
    ].forEach((text) => expect(texts).not.toContain(text));
  });

  it("does not report a pure reorder as a text edit", () => {
    const first = { id: "first-old", company: "Alpha", position: "Engineer" };
    const second = { id: "second-old", company: "Beta", position: "Developer" };
    const afterFirst = { ...first, id: "first-new" };
    const afterSecond = { ...second, id: "second-new" };

    expect(getReviewSnippets(change(
      { experience: [first, second] },
      { experience: [afterSecond, afterFirst] },
    ))).toEqual([]);
  });

  it("keeps meaningful single character edits reviewable", () => {
    const snippets = getReviewSnippets(change(
      { personal: { fullName: "A" } },
      { personal: { fullName: "B" } },
    ));

    expect(snippets.map((snippet) => snippet.text)).toContain("B");
  });

  it("does not invent a highlight target for removed content", () => {
    const snippets = getReviewSnippets(change(
      {
        experience: [{
          id: "removed",
          company: "Removed company",
          position: "Engineer",
        }],
      },
      { experience: [] },
    ));

    expect(snippets).toEqual([]);
  });

  it("does not report unchanged repeated strings as edits", () => {
    const before = {
      summary: "Built reliable tools.",
      experience: [{ id: "work", company: "Google", descriptions: [{ id: "d1", value: "Built reliable tools." }] }],
    };
    const after = {
      summary: "Built reliable tools.",
      experience: [{ id: "work", company: "Google", descriptions: [{ id: "d1", value: "Built reliable tools." }] }],
    };

    expect(getReviewSnippets(change(before, after))).toEqual([]);
  });

  it("limits review snippets so large edits stay usable", () => {
    const before = { skills: [] };
    const after = {
      skills: Array.from({ length: 60 }, (_, index) => ({
        id: `skill-${index}`,
        category: `Category ${index}`,
        items: `Skill ${index}`,
      })),
    };

    expect(getReviewSnippets(change(before, after))).toHaveLength(40);
  });
});
