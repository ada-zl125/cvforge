"use client";

import { useLayoutEffect } from "react";
import { TOP, CONTENT_H } from "@/lib/page-constants";

interface Props {
  children: React.ReactNode;
  style?: React.CSSProperties;
  className?: string;
}

const PAGE_BREAK_BUFFER = 2;

function parsePx(v: React.CSSProperties["marginTop"]): number {
  if (v === undefined || v === null) return 0;
  if (typeof v === "number") return v;
  const m = String(v).match(/^([\d.]+)px$/);
  return m ? parseFloat(m[1]) : 0;
}

/**
 * Processes all [data-page-break-avoid] elements within a [data-cv-root] in a
 * single DOM-order pass. Positions are read before any writes (avoids layout
 * thrashing). The `shift` accumulator compensates for pending margin deltas that
 * haven't yet been flushed by the browser, so each element's naturalY is exact.
 */
function processRoot(cvRoot: HTMLElement): void {
  const els = Array.from(cvRoot.querySelectorAll<HTMLElement>("[data-page-break-avoid]"));
  if (els.length === 0) return;

  // One forced reflow here; no further reflows during the write phase.
  const rootRect = cvRoot.getBoundingClientRect();
  const scaleY = rootRect.height > 0 && cvRoot.offsetHeight > 0
    ? rootRect.height / cvRoot.offsetHeight
    : 1;

  // Phase 1 — batch-read positions and previously applied extra margins.
  const snapshots = els.map((el) => {
    const rect = el.getBoundingClientRect();
    return {
      el,
      top: (rect.top - rootRect.top) / scaleY,
      height: rect.height / scaleY,
      prev: parseFloat(el.style.getPropertyValue("--page-break-extra")) || 0,
    };
  });

  // Phase 2 — compute needed margins with shift, then write CSS variables.
  // `shift` tracks the cumulative delta of margins changed so far in this pass.
  // Without it, elements after a changed element would compute wrong naturalY
  // (their DOM positions haven't been updated by the browser yet).
  let shift = 0;
  for (const { el, top, height, prev } of snapshots) {
    const naturalY = top - prev + shift;

    let needed = 0;
    if (naturalY >= TOP && height < CONTENT_H) {
      const pagePos = (naturalY - TOP) % CONTENT_H;
      if (pagePos + height > CONTENT_H) needed = CONTENT_H - pagePos + PAGE_BREAK_BUFFER;
    }

    if (needed !== prev) {
      el.style.setProperty("--page-break-extra", `${needed}px`);
    }
    shift += needed - prev;
  }
}

/**
 * Coordinator for page-break avoidance. Place once as an ancestor of all CV
 * templates. After each render it runs a single-pass computation across all
 * [data-page-break-avoid] elements and applies extra top-margins via CSS custom
 * properties — no React setState, so there are zero cascading re-render cycles.
 */
export function PageBreakProvider({ children }: { children: React.ReactNode }) {
  // No deps: must re-run after every render to catch layout changes.
  // No setState here — margins are applied via CSS variables directly, so this
  // effect never triggers additional React renders.
  useLayoutEffect(() => {
    for (const root of document.querySelectorAll<HTMLElement>("[data-cv-root]")) {
      processRoot(root);
    }
  });

  return <>{children}</>;
}

/**
 * Prevents its content from being split across A4 page boundaries.
 * Requires a PageBreakProvider ancestor to function.
 */
export function PageBreakAvoid({ children, style, className }: Props) {
  const baseMarginTop = parsePx(style?.marginTop);
  return (
    <div
      data-page-break-avoid
      style={{
        ...style,
        marginTop: `calc(${baseMarginTop}px + var(--page-break-extra, 0px))`,
      }}
      className={className}
    >
      {children}
    </div>
  );
}
