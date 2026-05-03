"use client";

import { useRef, useState, useEffect } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

interface EditorFrameProps {
  toolbar: React.ReactNode;
  form: React.ReactNode;
  preview: React.ReactNode;
}

const LAYOUT_STORAGE_KEY = "editor-layout-prefs";

interface LayoutPrefs {
  splitRatio: number;
  leftCollapsed: boolean;
  rightCollapsed: boolean;
}

function getInitialPrefs(): LayoutPrefs {
  if (typeof window === "undefined") {
    return { splitRatio: 40, leftCollapsed: false, rightCollapsed: false };
  }
  const saved = localStorage.getItem(LAYOUT_STORAGE_KEY);
  if (saved) {
    try {
      return JSON.parse(saved);
    } catch {
      // Ignore parse errors
    }
  }
  return { splitRatio: 40, leftCollapsed: false, rightCollapsed: false };
}

export function EditorFrame({ toolbar, form, preview }: EditorFrameProps) {
  const contentRef = useRef<HTMLDivElement>(null);
  const [prefs, setPrefs] = useState<LayoutPrefs>(getInitialPrefs);
  const [isDragging, setIsDragging] = useState(false);

  const toggleLeftCollapse = () => {
    setPrefs((prev) => {
      if (prev.leftCollapsed) {
        return { ...prev, leftCollapsed: false };
      } else {
        return { ...prev, leftCollapsed: true, rightCollapsed: false };
      }
    });
  };

  const toggleRightCollapse = () => {
    setPrefs((prev) => {
      if (prev.rightCollapsed) {
        return { ...prev, rightCollapsed: false };
      } else {
        return { ...prev, rightCollapsed: true, leftCollapsed: false };
      }
    });
  };

  const handleMouseDown = () => {
    setIsDragging(true);
  };

  useEffect(() => {
    if (!isDragging) return;

    function handleMouseMove(e: MouseEvent) {
      if (!contentRef.current) return;
      const rect = contentRef.current.getBoundingClientRect();
      const newRatio = ((e.clientX - rect.left) / rect.width) * 100;
      const clamped = Math.max(20, Math.min(80, newRatio));
      setPrefs((prev) => ({ ...prev, splitRatio: clamped }));
    }

    function handleMouseUp() {
      setIsDragging(false);
    }

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);
    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isDragging]);

  useEffect(() => {
    localStorage.setItem(LAYOUT_STORAGE_KEY, JSON.stringify(prefs));
  }, [prefs]);

  const { splitRatio, leftCollapsed, rightCollapsed } = prefs;
  const leftWidth = leftCollapsed ? 0 : splitRatio;
  const rightWidth = rightCollapsed ? 0 : 100 - splitRatio;
  const showDivider = !leftCollapsed && !rightCollapsed;

  return (
    <div className="flex h-screen flex-col">
      {toolbar}

      <div ref={contentRef} className="-mt-px flex min-h-0 flex-1 overflow-hidden">
        {/* Left: Form panel */}
        {!leftCollapsed && (
          <div
            className="editor-form-pane relative z-10 shrink-0 overflow-y-auto rounded-tr-lg border-r border-t border-border flex flex-col"
            style={{ width: `${leftWidth}%` }}
          >
            <div className="flex-1 overflow-y-auto">{form}</div>
            {showDivider && (
              <div className="flex justify-center border-t border-border py-1">
                <Button
                  variant="ghost"
                  size="icon-xs"
                  onClick={toggleLeftCollapse}
                  className="h-6 w-6 text-muted-foreground hover:text-foreground"
                  title="Collapse left panel"
                >
                  <ChevronLeft className="size-4" />
                </Button>
              </div>
            )}
          </div>
        )}

        {/* Draggable divider */}
        {showDivider && (
          <div
            onMouseDown={handleMouseDown}
            className={`w-1 ${isDragging ? "bg-primary" : "bg-border hover:bg-primary"} cursor-col-resize transition-colors`}
          />
        )}

        {/* Collapsed left panel button */}
        {leftCollapsed && !rightCollapsed && (
          <div className="flex shrink-0 items-center border-b border-r border-border px-2">
            <Button
              variant="ghost"
              size="icon-xs"
              onClick={toggleLeftCollapse}
              className="h-6 w-6 text-muted-foreground hover:text-foreground"
              title="Expand left panel"
            >
              <ChevronRight className="size-4" />
            </Button>
          </div>
        )}

        {/* Right: Preview panel */}
        {!rightCollapsed && (
          <div
            className="relative flex flex-1 flex-col overflow-hidden"
            style={{ width: `${rightWidth}%` }}
          >
            <div className="flex-1 overflow-y-auto">{preview}</div>
            {showDivider && (
              <div className="flex justify-center border-t border-border py-1">
                <Button
                  variant="ghost"
                  size="icon-xs"
                  onClick={toggleRightCollapse}
                  className="h-6 w-6 text-muted-foreground hover:text-foreground"
                  title="Collapse right panel"
                >
                  <ChevronRight className="size-4" />
                </Button>
              </div>
            )}
          </div>
        )}

        {/* Collapsed right panel button */}
        {rightCollapsed && !leftCollapsed && (
          <div className="flex shrink-0 items-center border-b border-border px-2">
            <Button
              variant="ghost"
              size="icon-xs"
              onClick={toggleRightCollapse}
              className="h-6 w-6 text-muted-foreground hover:text-foreground"
              title="Expand right panel"
            >
              <ChevronLeft className="size-4" />
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
