"use client";

import { useLayoutEffect, useRef, useState } from "react";
import { PAGE_W, PAGE_H, TOP, BOTTOM, CONTENT_H } from "@/lib/page-constants";
import { PageBreakProvider } from "@/components/shared/PageBreakAvoid";
import type { AgentChange } from "@/lib/agent/change-tracking";

interface PaginatedPreviewPanelProps {
  children: React.ReactNode;
  reviewChange?: AgentChange | null;
}

function collectStrings(value: unknown, parts: string[]): void {
  if (typeof value === "string") {
    const text = value.trim();
    if (text) parts.push(text);
    return;
  }

  if (Array.isArray(value)) {
    value.forEach((item) => collectStrings(item, parts));
    return;
  }

  if (value && typeof value === "object") {
    Object.entries(value).forEach(([key, nested]) => {
      if (key !== "id" && key !== "photo") collectStrings(nested, parts);
    });
  }
}

function getAddedTextSnippets(change: AgentChange): string[] {
  const beforeParts: string[] = [];
  const afterParts: string[] = [];
  collectStrings(change.before, beforeParts);
  collectStrings(change.after, afterParts);

  const previous = new Map<string, number>();
  beforeParts.forEach((part) => previous.set(part, (previous.get(part) ?? 0) + 1));

  return afterParts
    .filter((part) => {
      const count = previous.get(part) ?? 0;
      if (count > 0) {
        previous.set(part, count - 1);
        return false;
      }
      return part.length > 1;
    })
    .sort((a, b) => b.length - a.length)
    .slice(0, 40);
}

function clearReviewMarks(root: HTMLElement): void {
  root.querySelectorAll("mark[data-agent-review]").forEach((mark) => {
    mark.replaceWith(document.createTextNode(mark.textContent ?? ""));
  });
  root.normalize();
}

function markTextNode(node: Text, snippets: string[]): boolean {
  const source = node.nodeValue ?? "";
  const match = snippets
    .map((snippet) => ({ snippet, index: source.indexOf(snippet) }))
    .filter((item) => item.index >= 0)
    .sort((a, b) => a.index - b.index || b.snippet.length - a.snippet.length)[0];

  if (!match) return false;

  const fragment = document.createDocumentFragment();
  const before = source.slice(0, match.index);
  const selected = source.slice(match.index, match.index + match.snippet.length);
  const after = source.slice(match.index + match.snippet.length);

  if (before) fragment.appendChild(document.createTextNode(before));

  const mark = document.createElement("mark");
  mark.dataset.agentReview = "true";
  mark.style.backgroundColor = "#fef3c7";
  mark.style.color = "inherit";
  mark.style.transition = "background-color 180ms ease";
  mark.textContent = selected;
  fragment.appendChild(mark);

  if (after) fragment.appendChild(document.createTextNode(after));
  node.replaceWith(fragment);
  return true;
}

function ReviewHighlighter({
  rootRef,
  change,
}: {
  rootRef: React.RefObject<HTMLDivElement | null>;
  change?: AgentChange | null;
}) {
  useLayoutEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    clearReviewMarks(root);
    if (!change) return;

    const snippets = getAddedTextSnippets(change);
    if (snippets.length === 0) return;

    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
      acceptNode(node) {
        const parent = node.parentElement;
        if (!parent || parent.closest("mark[data-agent-review]")) return NodeFilter.FILTER_REJECT;
        return snippets.some((snippet) => (node.nodeValue ?? "").includes(snippet))
          ? NodeFilter.FILTER_ACCEPT
          : NodeFilter.FILTER_REJECT;
      },
    });

    const nodes: Text[] = [];
    while (walker.nextNode()) nodes.push(walker.currentNode as Text);

    nodes.forEach((node) => {
      markTextNode(node, snippets);
    });

    const firstMark = root.querySelector("mark[data-agent-review]");
    firstMark?.scrollIntoView({ behavior: "smooth", block: "center" });

    const handlePointerDown = (event: PointerEvent) => {
      const target = event.target;
      if (target instanceof Element && target.closest("mark[data-agent-review]")) return;
      clearReviewMarks(root);
    };

    window.addEventListener("pointerdown", handlePointerDown);

    return () => {
      window.removeEventListener("pointerdown", handlePointerDown);
      clearReviewMarks(root);
    };
  }, [change, rootRef]);

  return null;
}

export function PaginatedPreviewPanel({ children, reviewChange }: PaginatedPreviewPanelProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const visiblePagesRef = useRef<HTMLDivElement>(null);
  const measureRef = useRef<HTMLDivElement>(null);
  const [numPages, setNumPages] = useState(1);
  const [scale, setScale] = useState(1);

  useLayoutEffect(() => {
    const el = measureRef.current;
    if (!el) return;

    const calc = () =>
      Math.max(1, Math.ceil((el.scrollHeight - TOP - BOTTOM - 8) / CONTENT_H));

    setNumPages(calc());

    let timer: ReturnType<typeof setTimeout> | null = null;
    const ro = new ResizeObserver(() => {
      if (timer) clearTimeout(timer);
      timer = setTimeout(() => {
        setNumPages(calc());
        timer = null;
      }, 400);
    });
    ro.observe(el);

    return () => {
      ro.disconnect();
      if (timer) clearTimeout(timer);
    };
  }, []);

  useLayoutEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const updateScale = () => {
      const available = container.clientWidth - 64;
      setScale(Math.min(1, Math.max(0.3, available / PAGE_W)));
    };

    updateScale();

    const ro = new ResizeObserver(updateScale);
    ro.observe(container);

    return () => ro.disconnect();
  }, []);

  return (
    <PageBreakProvider>
    <div ref={containerRef} className="flex flex-1 items-start justify-center overflow-y-auto bg-muted/50 px-8 pt-8 pb-0">
      {/* Hidden export target — captured by lib/export.ts via .preview-a4 > div */}
      <div style={{ position: "fixed", left: "-9999px", top: 0, width: `${PAGE_W}px`, pointerEvents: "none" }}>
        <div className="preview-a4">
          <div ref={measureRef}>
            {children}
          </div>
        </div>
      </div>

      {/* Visible paginated pages */}
      <div ref={visiblePagesRef} className="flex flex-col items-center gap-4 pb-8">
        <ReviewHighlighter rootRef={visiblePagesRef} change={reviewChange} />
        {Array.from({ length: numPages }).map((_, i) => (
          <div
            key={i}
            style={{
              width: `${PAGE_W * scale}px`,
              height: `${PAGE_H * scale}px`,
              flexShrink: 0,
              position: "relative",
            }}
          >
            <div
              className="overflow-hidden rounded-sm border border-border bg-white shadow-lg transition-colors duration-200 hover:border-black"
              style={{
                width: `${PAGE_W}px`,
                height: `${PAGE_H}px`,
                position: "absolute",
                top: 0,
                left: 0,
                transform: `scale(${scale})`,
                transformOrigin: "top left",
              }}
            >
              {/* Inset window preserves TOP/BOTTOM margins on every page */}
              <div
                style={{
                  position: "absolute",
                  top: TOP,
                  left: 0,
                  right: 0,
                  height: CONTENT_H,
                  overflow: "hidden",
                }}
              >
                <div style={{ transform: `translateY(${-(TOP + i * CONTENT_H)}px)` }}>
                  {children}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
    </PageBreakProvider>
  );
}
