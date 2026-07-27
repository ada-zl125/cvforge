"use client";

import { useCallback, useLayoutEffect, useRef, useState } from "react";
import FadeContent from "@/components/FadeContent";
import { PAGE_W, PAGE_H, TOP, BOTTOM, CONTENT_H } from "@/lib/page-constants";
import { PageBreakProvider } from "@/components/shared/PageBreakAvoid";
import type { AgentChange } from "@/lib/agent/change-tracking";
import { getReviewSnippets, type ReviewSnippet } from "@/lib/agent/review-highlighting";

interface PaginatedPreviewPanelProps {
  children: React.ReactNode;
  reviewChange?: AgentChange | null;
  isStreaming?: boolean;
}

function normalizeScopeText(value: string): string {
  return value.replace(/\s+/g, " ").trim();
}

function getReviewScopeText(node: Text): string {
  const parent = node.parentElement;
  const scope =
    parent?.closest("[data-page-break-avoid]") ??
    parent?.closest("section") ??
    parent?.closest("p") ??
    parent;

  return normalizeScopeText(scope?.textContent ?? "");
}

function getSnippetKey(snippet: ReviewSnippet): string {
  return `${snippet.text}\n${snippet.anchors.join("\n")}`;
}

function getSnippetScopeScore(node: Text, snippet: ReviewSnippet): number {
  if (snippet.anchors.length === 0) return 0;
  const scopeText = getReviewScopeText(node);
  return snippet.anchors.reduce(
    (score, anchor) => score + Number(scopeText.includes(anchor)),
    0,
  );
}

function getBestScopeScores(
  nodes: Text[],
  snippets: ReviewSnippet[],
): Map<string, number> {
  const scores = new Map<string, number>();

  nodes.forEach((node) => {
    const source = node.nodeValue ?? "";
    snippets.forEach((snippet) => {
      if (!source.includes(snippet.text)) return;
      const key = getSnippetKey(snippet);
      const score = getSnippetScopeScore(node, snippet);
      scores.set(key, Math.max(scores.get(key) ?? 0, score));
    });
  });

  return scores;
}

function markTextNode(
  node: Text,
  snippets: ReviewSnippet[],
  bestScopeScores: Map<string, number>,
): boolean {
  const source = node.nodeValue ?? "";
  const matches = snippets
    .flatMap((snippet) => {
      const score = getSnippetScopeScore(node, snippet);
      if (score < (bestScopeScores.get(getSnippetKey(snippet)) ?? 0)) return [];

      const indexes: number[] = [];
      let searchFrom = 0;
      while (searchFrom < source.length) {
        const index = source.indexOf(snippet.text, searchFrom);
        if (index < 0) break;
        indexes.push(index);
        searchFrom = index + snippet.text.length;
      }

      return indexes.map((index) => ({
        index,
        text: snippet.text,
      }));
    })
    .sort((a, b) => a.index - b.index || b.text.length - a.text.length);

  const selected: typeof matches = [];
  let selectedUntil = 0;
  matches.forEach((match) => {
    if (match.index < selectedUntil) return;
    selected.push(match);
    selectedUntil = match.index + match.text.length;
  });
  if (selected.length === 0) return false;

  const fragment = document.createDocumentFragment();
  let cursor = 0;

  selected.forEach((match) => {
    const before = source.slice(cursor, match.index);
    if (before) fragment.appendChild(document.createTextNode(before));

    const mark = document.createElement("mark");
    mark.dataset.agentReview = "true";
    mark.style.backgroundColor = "#fff9db";
    mark.style.color = "inherit";
    mark.style.transition = "background-color 180ms ease";
    mark.textContent = match.text;
    fragment.appendChild(mark);

    cursor = match.index + match.text.length;
  });

  const after = source.slice(cursor);
  if (after) fragment.appendChild(document.createTextNode(after));
  node.replaceWith(fragment);
  return true;
}

function isMarkVisibleInPage(mark: Element): boolean {
  const pageWindow = mark.closest("[data-agent-page-window]");
  if (!pageWindow) return true;

  const markRect = mark.getBoundingClientRect();
  const pageRect = pageWindow.getBoundingClientRect();
  return (
    markRect.bottom > pageRect.top &&
    markRect.top < pageRect.bottom &&
    markRect.right > pageRect.left &&
    markRect.left < pageRect.right
  );
}

export function applyReviewHighlights(
  root: HTMLElement,
  snippets: ReviewSnippet[],
): HTMLElement[] {
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
    acceptNode(node) {
      const parent = node.parentElement;
      if (!parent || parent.closest("mark[data-agent-review]")) {
        return NodeFilter.FILTER_REJECT;
      }
      return snippets.some((snippet) =>
        (node.nodeValue ?? "").includes(snippet.text)
      )
        ? NodeFilter.FILTER_ACCEPT
        : NodeFilter.FILTER_REJECT;
    },
  });

  const nodes: Text[] = [];
  while (walker.nextNode()) nodes.push(walker.currentNode as Text);

  const bestScopeScores = getBestScopeScores(nodes, snippets);
  nodes.forEach((node) => {
    markTextNode(node, snippets, bestScopeScores);
  });

  return Array.from(
    root.querySelectorAll<HTMLElement>("mark[data-agent-review]"),
  );
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

function syncPreviewReplicas(source: HTMLElement, root: HTMLElement): void {
  // Effects decorate these unmanaged replicas without changing React owned nodes.
  root.querySelectorAll<HTMLElement>("[data-preview-replica]").forEach((replica) => {
    const fragment = document.createDocumentFragment();
    source.childNodes.forEach((node) => {
      fragment.appendChild(node.cloneNode(true));
    });
    replica.replaceChildren(fragment);
  });
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

export function PaginatedPreviewPanel({ children, reviewChange, isStreaming = false }: PaginatedPreviewPanelProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const visiblePagesRef = useRef<HTMLDivElement>(null);
  const measureRef = useRef<HTMLDivElement>(null);
  const previousTextPartsRef = useRef<string[]>([]);
  const cleanupTimerRef = useRef<number | null>(null);
  const lastSyncedSourceHtmlRef = useRef("");
  const [numPages, setNumPages] = useState(1);
  const [scale, setScale] = useState(1);
  const [dismissedReviewChange, setDismissedReviewChange] = useState<AgentChange | null>(null);
  const activeReviewChange =
    reviewChange && dismissedReviewChange !== reviewChange
      ? reviewChange
      : null;

  const refreshPreviewReplicas = useCallback(() => {
    const source = measureRef.current;
    const root = visiblePagesRef.current;
    if (!source || !root) return;

    if (cleanupTimerRef.current) {
      window.clearTimeout(cleanupTimerRef.current);
      cleanupTimerRef.current = null;
    }

    const currentParts = collectPreviewTextParts(source);
    const previousParts = previousTextPartsRef.current;
    previousTextPartsRef.current = currentParts;
    lastSyncedSourceHtmlRef.current = source.innerHTML;

    syncPreviewReplicas(source, root);

    if (activeReviewChange) {
      const snippets = getReviewSnippets(activeReviewChange);
      if (snippets.length > 0) {
        const marks = applyReviewHighlights(root, snippets);
        const firstMark = marks.find(isMarkVisibleInPage) ?? marks[0];
        firstMark?.scrollIntoView?.({ behavior: "smooth", block: "center" });
      }
    }

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
    let didPrint = false;
    nodes.forEach((node) => {
      didPrint = printTextNode(node, snippets) || didPrint;
    });
    if (!didPrint) return;

    cleanupTimerRef.current = window.setTimeout(() => {
      clearStreamingPrint(root);
      cleanupTimerRef.current = null;
    }, 2600);
  }, [activeReviewChange, isStreaming]);

  useLayoutEffect(() => {
    refreshPreviewReplicas();
  });

  useLayoutEffect(() => {
    const source = measureRef.current;
    if (!source) return;

    const observer = new MutationObserver(() => {
      if (source.innerHTML === lastSyncedSourceHtmlRef.current) return;
      refreshPreviewReplicas();
    });
    observer.observe(source, {
      childList: true,
      characterData: true,
      subtree: true,
    });

    return () => observer.disconnect();
  }, [refreshPreviewReplicas]);

  useLayoutEffect(() => {
    if (!activeReviewChange) return;

    const handlePointerDown = (event: PointerEvent) => {
      const target = event.target;
      if (target instanceof Element && target.closest("mark[data-agent-review]")) return;
      setDismissedReviewChange(activeReviewChange);
    };

    window.addEventListener("pointerdown", handlePointerDown);
    return () => window.removeEventListener("pointerdown", handlePointerDown);
  }, [activeReviewChange]);

  useLayoutEffect(() => {
    return () => {
      if (cleanupTimerRef.current) window.clearTimeout(cleanupTimerRef.current);
    };
  }, []);

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
          <div ref={measureRef} data-preview-source>
            {children}
          </div>
        </div>
      </div>

      {/* Visible paginated pages */}
      <FadeContent className="pb-4" duration={520} threshold={0} initialOpacity={0}>
      <div ref={visiblePagesRef} className="flex flex-col items-center gap-4">
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
                data-agent-page-window
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
                  <div data-preview-replica />
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
