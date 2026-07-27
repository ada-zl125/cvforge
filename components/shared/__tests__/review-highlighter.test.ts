import {
  createElement,
  useState,
  type ComponentProps,
  type ComponentType,
  type ReactNode,
} from "react";
import { createRoot, type Root } from "react-dom/client";
import { flushSync } from "react-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  applyReviewHighlights,
  PaginatedPreviewPanel,
} from "@/components/shared/PaginatedPreviewPanel";
import { GeneralTemplate } from "@/components/editor/templates/GeneralTemplate";
import type { AgentChange } from "@/lib/agent/change-tracking";
import type { ResumeContent } from "@/lib/types/resume";

vi.mock("@/components/FadeContent", () => ({
  default: ({ children }: { children: ReactNode }) => children,
}));

type TestPreviewPanelProps = Omit<
  ComponentProps<typeof PaginatedPreviewPanel>,
  "children"
>;

const TestPreviewPanel =
  PaginatedPreviewPanel as ComponentType<TestPreviewPanelProps>;

class ResizeObserverMock {
  observe() {}
  disconnect() {}
}

function StatefulPreview() {
  const [value, setValue] = useState("English");
  return createElement(
    "div",
    null,
    createElement("p", null, value),
    createElement("button", { onClick: () => setValue("中文") }, "Update"),
  );
}

function change(before: unknown, after: unknown): AgentChange {
  return {
    id: "review-change",
    before,
    after,
    beforeSignature: "before",
    afterSignature: "after",
    addedWords: 1,
    removedWords: 1,
    toolNames: ["update_personal"],
  };
}

function renderPreview(
  root: Root,
  text: string | null,
  reviewChange: AgentChange | null = null,
  isStreaming = false,
) {
  flushSync(() => {
    root.render(
      createElement(
        TestPreviewPanel,
        {
          reviewChange,
          isStreaming,
        },
        createElement("p", null, text, createElement("span", null, "tail")),
      ),
    );
  });
}

function resumeContent(phone: string): ResumeContent {
  return {
    personal: {
      fullName: "Ada Lovelace",
      contacts: [
        { id: "location", type: "location", value: "London, UK" },
        { id: "phone", type: "phone", countryCode: "+44", value: phone },
      ],
    },
    sections: [],
    experience: [],
    education: [],
    skills: [],
    projects: [],
    awards: [],
  };
}

function renderResumePreview(
  root: Root,
  content: ResumeContent,
  reviewChange: AgentChange | null,
) {
  flushSync(() => {
    root.render(
      createElement(
        TestPreviewPanel,
        {
          reviewChange,
        },
        createElement(GeneralTemplate, { content, language: "en" }),
      ),
    );
  });
}

beforeEach(() => {
  vi.stubGlobal("ResizeObserver", ResizeObserverMock);
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.useRealTimers();
});

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

  it("keeps live preview updates safe after dismissing review highlights", () => {
    const container = document.createElement("div");
    document.body.appendChild(container);
    const root = createRoot(container);
    const reviewChange = change(
      { personal: { fullName: "Old name" } },
      { personal: { fullName: "Phone" } },
    );

    renderPreview(root, "Phone", reviewChange);
    const source = container.querySelector<HTMLElement>("[data-preview-source]");
    const replica = container.querySelector<HTMLElement>("[data-preview-replica]");

    expect(source?.querySelector("mark")).toBeNull();
    expect(replica?.querySelector("mark")?.textContent).toBe("Phone");

    flushSync(() => {
      window.dispatchEvent(new MouseEvent("pointerdown", { bubbles: true }));
    });
    renderPreview(root, "Phone +44", reviewChange);

    expect(replica?.querySelector("mark")).toBeNull();
    expect(replica?.textContent).toBe("Phone +44tail");

    renderPreview(root, null, reviewChange);
    expect(replica?.textContent).toBe("tail");

    flushSync(() => root.unmount());
    container.remove();
  });

  it("updates a phone contact after its review highlight is dismissed", () => {
    const container = document.createElement("div");
    document.body.appendChild(container);
    const root = createRoot(container);
    const initialContent = resumeContent("7123456789");
    const reviewChange = change(resumeContent(""), initialContent);

    renderResumePreview(root, initialContent, reviewChange);
    const replica = container.querySelector<HTMLElement>("[data-preview-replica]");
    expect(replica?.querySelector("mark")?.textContent).toBe("7123456789");

    flushSync(() => {
      window.dispatchEvent(new MouseEvent("pointerdown", { bubbles: true }));
    });
    renderResumePreview(root, resumeContent("7987654321"), reviewChange);

    expect(replica?.querySelector("mark")).toBeNull();
    expect(replica?.textContent).toContain("+44 7987654321");
    expect(replica?.textContent).not.toContain("+44 7123456789");

    flushSync(() => root.unmount());
    container.remove();
  });

  it("syncs visible replicas when a preview child updates independently", async () => {
    const container = document.createElement("div");
    document.body.appendChild(container);
    const root = createRoot(container);

    flushSync(() => {
      root.render(
        createElement(
          PaginatedPreviewPanel,
          null,
          createElement(StatefulPreview),
        ),
      );
    });
    const sourceButton =
      container.querySelector<HTMLButtonElement>("[data-preview-source] button");
    const replica = container.querySelector<HTMLElement>("[data-preview-replica]");
    expect(replica?.textContent).toBe("EnglishUpdate");

    flushSync(() => sourceButton?.click());
    await vi.waitFor(() => {
      expect(replica?.textContent).toBe("中文Update");
    });

    flushSync(() => root.unmount());
    container.remove();
  });

  it("keeps live preview updates safe after streaming cleanup", () => {
    vi.useFakeTimers();
    const container = document.createElement("div");
    document.body.appendChild(container);
    const root = createRoot(container);

    renderPreview(root, "Alpha");
    renderPreview(root, "Beta", null, true);
    const source = container.querySelector<HTMLElement>("[data-preview-source]");
    const replica = container.querySelector<HTMLElement>("[data-preview-replica]");

    expect(source?.querySelector("[data-agent-stream-print]")).toBeNull();
    expect(replica?.querySelector("[data-agent-stream-print]")?.textContent).toBe("Beta");

    vi.advanceTimersByTime(2600);
    expect(replica?.querySelector("[data-agent-stream-print]")).toBeNull();

    renderPreview(root, "Gamma", null, true);
    expect(replica?.textContent).toBe("Gammatail");

    renderPreview(root, null, null, true);
    expect(replica?.textContent).toBe("tail");

    flushSync(() => root.unmount());
    container.remove();
  });
});
