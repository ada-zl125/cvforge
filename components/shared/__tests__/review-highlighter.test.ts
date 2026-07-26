import type { ReactNode } from "react";
import { describe, expect, it, vi } from "vitest";
import { applyReviewHighlights } from "@/components/shared/PaginatedPreviewPanel";

vi.mock("@/components/FadeContent", () => ({
  default: ({ children }: { children: ReactNode }) => children,
}));

describe("review highlighter", () => {
  it("uses the strongest anchor match for repeated text", () => {
    const root = document.createElement("div");
    root.innerHTML = `
      <div data-page-break-avoid>Google London Built reliable tools.</div>
      <div data-page-break-avoid>Microsoft London Built reliable tools.</div>
    `;

    const marks = applyReviewHighlights(root, [{
      text: "Built reliable tools.",
      anchors: ["Microsoft", "London"],
    }]);

    expect(marks).toHaveLength(1);
    expect(marks[0].parentElement?.textContent).toContain("Microsoft");
  });

  it("marks multiple nonoverlapping changes in one text node", () => {
    const root = document.createElement("div");
    root.textContent = "Alpha and Beta";

    const marks = applyReviewHighlights(root, [
      { text: "Alpha", anchors: [] },
      { text: "Beta", anchors: [] },
    ]);

    expect(marks.map((mark) => mark.textContent)).toEqual(["Alpha", "Beta"]);
    expect(root.textContent).toBe("Alpha and Beta");
  });
});
