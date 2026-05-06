"use client";

import { useLayoutEffect, useRef, useState } from "react";
import { PAGE_W, PAGE_H, TOP, BOTTOM, CONTENT_H } from "@/lib/page-constants";
import { PageBreakProvider } from "@/components/shared/PageBreakAvoid";

interface PaginatedPreviewPanelProps {
  children: React.ReactNode;
}

export function PaginatedPreviewPanel({ children }: PaginatedPreviewPanelProps) {
  const containerRef = useRef<HTMLDivElement>(null);
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
      <div className="flex flex-col items-center gap-4 pb-8">
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
