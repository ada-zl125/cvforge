"use client";

import { useRef, useState, useLayoutEffect } from "react";
import { TOP, CONTENT_H } from "@/lib/page-constants";

interface Props {
  children: React.ReactNode;
  style?: React.CSSProperties;
  className?: string;
}

/**
 * Parses a CSS length value that is expected to be in px (e.g. "6px", 6).
 * Returns 0 for anything it cannot parse (em, %, etc.).
 */
function parsePx(v: React.CSSProperties["marginTop"]): number {
  if (v === undefined || v === null) return 0;
  if (typeof v === "number") return v;
  const m = String(v).match(/^([\d.]+)px$/);
  return m ? parseFloat(m[1]) : 0;
}

/**
 * Prevents its content from being split across A4 page boundaries.
 *
 * Uses marginTop (not paddingTop) so that getBoundingClientRect().top
 * reflects the applied offset, making the "natural position" calculation
 * stable and loop-free:
 *
 *   naturalY = elRect.top - rootRect.top - extraMargin
 *
 * After the margin is applied, elRect.top = originalTop + baseMargin + extraMargin,
 * so naturalY collapses back to originalTop + baseMargin — a fixed value —
 * and the effect converges after exactly one adjustment.
 */
export function PageBreakAvoid({ children, style, className }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const [extraMargin, setExtraMargin] = useState(0);

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;

    const root = el.closest("[data-cv-root]") as HTMLElement | null;
    if (!root) return;

    const rootRect = root.getBoundingClientRect();
    const elRect = el.getBoundingClientRect();

    // With marginTop, elRect.top already includes the extra margin we applied,
    // so subtracting it recovers the element's natural (un-pushed) position.
    const naturalY = elRect.top - rootRect.top - extraMargin;
    const elH = elRect.height; // height is unaffected by marginTop

    // Skip: element is taller than one page (unavoidable split) or still in
    // the template's top-padding zone.
    if (naturalY < TOP || elH >= CONTENT_H) return;

    const pagePos = (naturalY - TOP) % CONTENT_H;

    if (pagePos + elH > CONTENT_H) {
      // Crosses a page break — push the whole block to the next page.
      const needed = CONTENT_H - pagePos;
      if (needed !== extraMargin) setExtraMargin(needed);
    } else if (extraMargin !== 0) {
      setExtraMargin(0);
    }
  });

  // Combine the caller's base marginTop with our page-break extra margin so
  // both values are expressed in a single marginTop declaration.
  const baseMarginTop = parsePx(style?.marginTop);
  const totalMarginTop = baseMarginTop + extraMargin;

  const computedStyle: React.CSSProperties =
    totalMarginTop > 0
      ? { ...style, marginTop: `${totalMarginTop}px` }
      : { ...style, marginTop: style?.marginTop };

  return (
    <div ref={ref} style={computedStyle} className={className}>
      {children}
    </div>
  );
}
