"use client";

import { useRef, useState, useEffect } from "react";
import { ChevronLeft, ChevronRight, RotateCcw, Maximize2, Minimize2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface EditorFrameProps {
  toolbar: React.ReactNode;
  form: React.ReactNode;
  preview: React.ReactNode;
}

const LAYOUT_STORAGE_KEY = "editor-layout-prefs";
const DEFAULT_SPLIT_RATIO = 40;

interface LayoutPrefs {
  splitRatio: number;
  leftCollapsed: boolean;
  rightCollapsed: boolean;
  preSplitRatio?: number;
}

function getInitialPrefs(): LayoutPrefs {
  if (typeof window === "undefined") {
    return { splitRatio: DEFAULT_SPLIT_RATIO, leftCollapsed: false, rightCollapsed: false };
  }
  const saved = localStorage.getItem(LAYOUT_STORAGE_KEY);
  if (saved) {
    try {
      return JSON.parse(saved);
    } catch {
      // Ignore parse errors
    }
  }
  return { splitRatio: DEFAULT_SPLIT_RATIO, leftCollapsed: false, rightCollapsed: false };
}

export function EditorFrame({ toolbar, form, preview }: EditorFrameProps) {
  const contentRef = useRef<HTMLDivElement>(null);
  const [prefs, setPrefs] = useState<LayoutPrefs>(getInitialPrefs);
  const [isDragging, setIsDragging] = useState(false);
  const [isLeftHovered, setIsLeftHovered] = useState(false);

  const toggleLeftCollapse = () => {
    setPrefs((prev) => ({
      ...prev,
      leftCollapsed: !prev.leftCollapsed,
    }));
  };

  const toggleRightCollapse = () => {
    setPrefs((prev) => ({
      ...prev,
      rightCollapsed: !prev.rightCollapsed,
    }));
  };

  const toggleMaximizeLeft = () => {
    setPrefs((prev) => {
      if (prev.rightCollapsed) {
        return {
          ...prev,
          rightCollapsed: false,
          splitRatio: prev.preSplitRatio || DEFAULT_SPLIT_RATIO,
          preSplitRatio: undefined,
        };
      } else {
        return {
          ...prev,
          rightCollapsed: true,
          leftCollapsed: false,
          preSplitRatio: prev.splitRatio,
        };
      }
    });
  };

  const resetLayout = () => {
    setPrefs({
      splitRatio: DEFAULT_SPLIT_RATIO,
      leftCollapsed: false,
      rightCollapsed: false,
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
  const leftWidth = leftCollapsed ? 0 : rightCollapsed ? 100 : splitRatio;
  const rightWidth = rightCollapsed ? 0 : 100 - splitRatio;
  const showDivider = !leftCollapsed && !rightCollapsed;

  return (
    <div className="flex h-screen flex-col" data-left-hovered={isLeftHovered ? "true" : "false"}>
      <style>{`
        [data-left-hovered="true"] [data-toolbar] {
          border-bottom-color: rgb(0 0 0 / 0.3);
          transition: border-bottom-color 0.2s ease-in-out;
        }
      `}</style>
      {toolbar}

      <div ref={contentRef} className="-mt-px flex min-h-0 flex-1 overflow-hidden">
        {/* Left: Form panel */}
        {!leftCollapsed && (
          <div
            className="editor-form-pane relative z-10 shrink-0 border-r border-t border-border flex flex-col transition-colors hover:border-r-foreground/20 hover:border-t-foreground/20"
            style={{ width: `${leftWidth}%` }}
            onMouseEnter={() => setIsLeftHovered(true)}
            onMouseLeave={() => setIsLeftHovered(false)}
          >
            {/* Top action bar */}
            <div className="flex shrink-0 items-center justify-between border-b border-border transition-colors px-3 py-2" data-editor-toolbar-inner>
              <Button
                variant="ghost"
                size="icon-xs"
                onClick={toggleLeftCollapse}
                className="h-6 w-6 text-muted-foreground hover:text-foreground"
                title="Collapse left panel"
              >
                <ChevronLeft className="size-4" />
              </Button>

              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="icon-xs"
                  onClick={toggleMaximizeLeft}
                  className="h-6 w-6 text-muted-foreground hover:text-foreground"
                  title={rightCollapsed ? "Restore split layout" : "Maximize left panel"}
                >
                  {rightCollapsed ? <Minimize2 className="size-4" /> : <Maximize2 className="size-4" />}
                </Button>
                <Button
                  variant="ghost"
                  size="icon-xs"
                  onClick={resetLayout}
                  className="h-6 w-6 text-muted-foreground hover:text-foreground"
                  title="Reset layout"
                >
                  <RotateCcw className="size-4" />
                </Button>
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto">{form}</div>
          </div>
        )}

        {/* Collapsed left panel button */}
        {leftCollapsed && (
          <div className="flex shrink-0 items-center border-r border-border px-2">
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

        {/* Draggable divider */}
        {showDivider && (
          <div
            onMouseDown={handleMouseDown}
            className={`w-1 cursor-col-resize transition-colors ${
              isDragging ? "bg-foreground" : "bg-border hover:bg-foreground"
            }`}
          />
        )}

        {/* Right: Preview panel */}
        {!rightCollapsed && (
          <div
            className="relative flex flex-1 flex-col overflow-hidden"
            style={{ width: `${rightWidth}%` }}
          >
            <div className="flex-1 overflow-y-auto">{preview}</div>
          </div>
        )}

        {/* Collapsed right panel button */}
        {rightCollapsed && (
          <div className="flex shrink-0 items-center border-border px-2">
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
