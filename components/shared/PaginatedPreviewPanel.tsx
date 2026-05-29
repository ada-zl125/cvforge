"use client";

import { useLayoutEffect, useRef, useState } from "react";
import FadeContent from "@/components/FadeContent";
import { PAGE_W, PAGE_H, TOP, BOTTOM, CONTENT_H } from "@/lib/page-constants";
import { PageBreakProvider } from "@/components/shared/PageBreakAvoid";
import type { AgentChange } from "@/lib/agent/change-tracking";

interface PaginatedPreviewPanelProps {
  children: React.ReactNode;
  reviewChange?: AgentChange | null;
  isStreaming?: boolean;
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

function formatDateRange(value: unknown): string {
  if (!value || typeof value !== "object") return "";

  const record = value as Record<string, unknown>;
  const startDate = typeof record.startDate === "string" ? record.startDate.trim() : "";
  const endDate = typeof record.endDate === "string" ? record.endDate.trim() : "";
  return [startDate, endDate].filter(Boolean).join(" – ");
}

function getItemId(value: unknown): string | undefined {
  if (!value || typeof value !== "object") return undefined;

  const id = (value as Record<string, unknown>).id;
  return typeof id === "string" ? id : undefined;
}

function collectChangedDateRanges(before: unknown, after: unknown, snippets: string[]): void {
  if (Array.isArray(after)) {
    const beforeItems = Array.isArray(before) ? before : [];
    const beforeById = new Map<string, unknown>();
    beforeItems.forEach((item) => {
      const id = getItemId(item);
      if (id) beforeById.set(id, item);
    });

    after.forEach((item, index) => {
      const id = getItemId(item);
      collectChangedDateRanges(id ? beforeById.get(id) : beforeItems[index], item, snippets);
    });
    return;
  }

  if (!after || typeof after !== "object") return;

  const afterRecord = after as Record<string, unknown>;
  const beforeRecord = before && typeof before === "object" ? before as Record<string, unknown> : {};
  const afterRange = formatDateRange(afterRecord);
  const beforeRange = formatDateRange(beforeRecord);
  if (afterRange && afterRange !== beforeRange) snippets.push(afterRange);

  Object.entries(afterRecord).forEach(([key, value]) => {
    if (key === "id" || key === "photo") return;
    collectChangedDateRanges(beforeRecord[key], value, snippets);
  });
}

function getAddedTextSnippets(change: AgentChange): string[] {
  const beforeParts: string[] = [];
  const afterParts: string[] = [];
  const dateRangeParts: string[] = [];
  collectStrings(change.before, beforeParts);
  collectStrings(change.after, afterParts);
  collectChangedDateRanges(change.before, change.after, dateRangeParts);

  const previous = new Map<string, number>();
  beforeParts.forEach((part) => previous.set(part, (previous.get(part) ?? 0) + 1));

  const addedParts = afterParts
    .filter((part) => {
      const count = previous.get(part) ?? 0;
      if (count > 0) {
        previous.set(part, count - 1);
        return false;
      }
      return part.length > 1;
    });

  return Array.from(new Set([...dateRangeParts, ...addedParts]))
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
  mark.style.backgroundColor = "#fff9db";
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

function collectPreviewTextParts(root: HTMLElement): string[] {
  const parts: string[] = [];
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
    acceptNode(node) {
      const parent = node.parentElement;
      if (!parent || parent.closest("[data-agent-stream-print], mark[data-agent-review]")) {
        return NodeFilter.FILTER_REJECT;
      }

      return (node.nodeValue ?? "").trim().length > 1
        ? NodeFilter.FILTER_ACCEPT
        : NodeFilter.FILTER_REJECT;
    },
  });

  while (walker.nextNode()) {
    const text = (walker.currentNode.nodeValue ?? "").trim();
    if (text) parts.push(text);
  }

  return parts;
}

function getChangedPreviewSnippets(beforeParts: string[], afterParts: string[]): string[] {
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
    .slice(0, 36);
}

function clearStreamingPrint(root: HTMLElement): void {
  root.querySelectorAll("[data-agent-stream-print]").forEach((span) => {
    span.replaceWith(document.createTextNode(span.textContent ?? ""));
  });
  root.normalize();
}

function printTextNode(node: Text, snippets: string[]): boolean {
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
  const animatedChars = Array.from(selected).slice(0, 280);
  const rest = Array.from(selected).slice(280).join("");

  if (before) fragment.appendChild(document.createTextNode(before));

  const print = document.createElement("span");
  print.dataset.agentStreamPrint = "true";
  print.className = "cv-streaming-print";

  animatedChars.forEach((char, index) => {
    const charSpan = document.createElement("span");
    charSpan.className = "cv-streaming-print-char";
    charSpan.style.animationDelay = `${Math.min(index * 16, 1200)}ms`;
    charSpan.textContent = char;
    print.appendChild(charSpan);
  });

  fragment.appendChild(print);
  if (rest) fragment.appendChild(document.createTextNode(rest));
  if (after) fragment.appendChild(document.createTextNode(after));

  node.replaceWith(fragment);
  return true;
}

function StreamingPrintEffect({
  rootRef,
  isStreaming,
}: {
  rootRef: React.RefObject<HTMLDivElement | null>;
  isStreaming: boolean;
}) {
  const previousTextPartsRef = useRef<string[]>([]);
  const cleanupTimerRef = useRef<number | null>(null);

  useLayoutEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    if (cleanupTimerRef.current) {
      window.clearTimeout(cleanupTimerRef.current);
      cleanupTimerRef.current = null;
    }

    clearStreamingPrint(root);

    const currentParts = collectPreviewTextParts(root);
    const previousParts = previousTextPartsRef.current;
    previousTextPartsRef.current = currentParts;

    if (!isStreaming || previousParts.length === 0) return;

    const snippets = getChangedPreviewSnippets(previousParts, currentParts);
    if (snippets.length === 0) return;

    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
      acceptNode(node) {
        const parent = node.parentElement;
        if (!parent || parent.closest("[data-agent-stream-print], mark[data-agent-review]")) {
          return NodeFilter.FILTER_REJECT;
        }

        return snippets.some((snippet) => (node.nodeValue ?? "").includes(snippet))
          ? NodeFilter.FILTER_ACCEPT
          : NodeFilter.FILTER_REJECT;
      },
    });

    const nodes: Text[] = [];
    while (walker.nextNode()) nodes.push(walker.currentNode as Text);
    nodes.forEach((node) => {
      printTextNode(node, snippets);
    });

    cleanupTimerRef.current = window.setTimeout(() => {
      clearStreamingPrint(root);
      cleanupTimerRef.current = null;
    }, 2600);
  });

  useLayoutEffect(() => {
    const root = rootRef.current;
    return () => {
      if (cleanupTimerRef.current) window.clearTimeout(cleanupTimerRef.current);
      if (root) clearStreamingPrint(root);
    };
  }, [rootRef]);

  return null;
}

export function PaginatedPreviewPanel({ children, reviewChange, isStreaming = false }: PaginatedPreviewPanelProps) {
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
      const available = container.clientWidth - 32;
      setScale(Math.min(1, Math.max(0.3, available / PAGE_W)));
    };

    updateScale();

    const ro = new ResizeObserver(updateScale);
    ro.observe(container);

    return () => ro.disconnect();
  }, []);

  return (
    <PageBreakProvider>
    <div ref={containerRef} className="flex flex-1 items-start justify-center overflow-y-auto bg-transparent px-4 pt-4 pb-0">
      {/* Hidden export target — captured by lib/export.ts via .preview-a4 > div */}
      <div style={{ position: "fixed", left: "-9999px", top: 0, width: `${PAGE_W}px`, pointerEvents: "none" }}>
        <div className="preview-a4">
          <div ref={measureRef}>
            {children}
          </div>
        </div>
      </div>

      {/* Visible paginated pages */}
      <FadeContent className="pb-4" duration={520} threshold={0} initialOpacity={0}>
      <div ref={visiblePagesRef} className="flex flex-col items-center gap-4">
        <ReviewHighlighter rootRef={visiblePagesRef} change={reviewChange} />
        <StreamingPrintEffect rootRef={visiblePagesRef} isStreaming={isStreaming} />
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
              className="preview-a4 overflow-hidden rounded-sm border border-black/10 bg-white shadow-[0_12px_36px_rgba(0,0,0,0.12)] transition-all duration-200 hover:border-black hover:shadow-[0_16px_46px_rgba(0,0,0,0.15)]"
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
      </FadeContent>
    </div>
    </PageBreakProvider>
  );
}
