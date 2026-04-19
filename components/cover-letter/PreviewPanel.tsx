"use client";

import { useRef, useState, useLayoutEffect } from "react";
import type { CoverLetterContent } from "@/lib/types/cover-letter";
import { CoverLetterTemplate } from "./templates/CoverLetterTemplate";
import { PAGE_H, TOP, BOTTOM, CONTENT_H } from "@/lib/page-constants";

interface Props {
  content: CoverLetterContent;
}

export function PreviewPanel({ content }: Props) {
  const measureRef = useRef<HTMLDivElement>(null);
  const [numPages, setNumPages] = useState(1);

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

  return (
    <div className="flex flex-1 items-start justify-center overflow-y-auto bg-muted/50 p-8">
      {/* Hidden export target — captured by lib/export.ts via .preview-a4 > div */}
      <div style={{ position: "fixed", left: "-9999px", top: 0, width: "794px", pointerEvents: "none" }}>
        <div className="preview-a4">
          <div ref={measureRef}>
            <CoverLetterTemplate content={content} />
          </div>
        </div>
      </div>

      {/* Visible paginated pages */}
      <div className="flex flex-col items-center gap-4">
        {Array.from({ length: numPages }).map((_, i) => (
          <div
            key={i}
            className="overflow-hidden rounded-sm border border-border bg-white shadow-lg transition-colors duration-200 hover:border-black"
            style={{ width: "794px", height: `${PAGE_H}px`, flexShrink: 0, position: "relative" }}
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
                <CoverLetterTemplate content={content} />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
