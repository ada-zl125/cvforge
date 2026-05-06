"use client";

import { useRef, useState, useEffect } from "react";
import { Bot, ChevronLeft, ChevronRight, PenLine, RotateCcw, Maximize2, Minimize2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useUILanguage } from "@/lib/ui-language";
import { t } from "@/lib/translations";

interface EditorFrameProps {
  toolbar: React.ReactNode;
  form: React.ReactNode;
  preview: React.ReactNode;
  isAgentMode?: boolean;
  isLLMConfigured?: boolean;
  onModeToggle?: () => void;
}

const DEFAULT_SPLIT_RATIO = 40;

interface LayoutPrefs {
  splitRatio: number;
  leftCollapsed: boolean;
  rightCollapsed: boolean;
  preSplitRatio?: number;
}

export function EditorFrame({
  toolbar,
  form,
  preview,
  isAgentMode = false,
  isLLMConfigured = false,
  onModeToggle,
}: EditorFrameProps) {
  const { lang } = useUILanguage();
  const tr = t[lang];
  const contentRef = useRef<HTMLDivElement>(null);
  const [prefs, setPrefs] = useState<LayoutPrefs>(() => ({
    splitRatio: DEFAULT_SPLIT_RATIO,
    leftCollapsed: false,
    rightCollapsed: typeof window !== "undefined" && window.innerWidth < 768,
  }));
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

  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
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


  const { splitRatio, leftCollapsed, rightCollapsed } = prefs;
  const leftWidth = leftCollapsed ? 0 : rightCollapsed ? 100 : splitRatio;
  const rightWidth = rightCollapsed ? 0 : 100 - splitRatio;
  const showDivider = !leftCollapsed;

  const shouldBlackHover = isAgentMode && isLLMConfigured;

  return (
    <div className={`flex h-screen flex-col ${isDragging ? "select-none" : ""}`}>
      <style>{`
        .editor-form-pane[data-left-hovered="true"] [data-editor-toolbar-inner] {
          border-bottom-color: rgb(0 0 0 / 0.2);
          transition: border-bottom-color 0.2s ease-in-out;
        }
        ${shouldBlackHover ? `
          .editor-form-pane:hover {
            border-right-color: rgb(0 0 0) !important;
            border-top-color: rgb(0 0 0) !important;
          }
        ` : ``}
      `}</style>
      {toolbar}

      <div ref={contentRef} className="-mt-px flex min-h-0 flex-1 overflow-hidden">
        {/* Left: Form panel */}
        {!leftCollapsed && (
          <div
            className={`editor-form-pane relative z-10 shrink-0 border-r border-t border-border flex flex-col transition-colors ${
              shouldBlackHover ? "" : "hover:border-r-foreground/20 hover:border-t-foreground/20"
            }`}
            style={{ width: `${leftWidth}%` }}
            data-left-hovered={isLeftHovered ? "true" : "false"}
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
                {onModeToggle && (
                  <Button
                    variant="ghost"
                    size="icon-xs"
                    onClick={onModeToggle}
                    className="h-6 w-6 text-muted-foreground hover:text-foreground"
                    title={isAgentMode ? tr.agent.switchToEditMode : tr.agent.switchToAgentMode}
                  >
                    {isAgentMode ? <PenLine className="size-4" /> : <Bot className="size-4" />}
                  </Button>
                )}
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
          <div className="flex shrink-0 items-start border-r border-border px-2 pt-3">
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
              isDragging ? "bg-foreground/50" : "bg-border hover:bg-foreground/50"
            }`}
          />
        )}

        {/* Right: Preview panel */}
        {!rightCollapsed && (
          <div
            className="relative flex flex-1 flex-col overflow-hidden bg-muted/50"
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
