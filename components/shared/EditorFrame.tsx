"use client";

import { useRef, useState, useEffect } from "react";
import { ChevronLeft, ChevronRight, RotateCcw, Maximize2, Minimize2 } from "lucide-react";
import AnimatedContent from "@/components/AnimatedContent";
import FadeContent from "@/components/FadeContent";
import { Button } from "@/components/ui/button";

interface EditorFrameProps {
  toolbar: React.ReactNode;
  form: React.ReactNode;
  preview: React.ReactNode;
  isAgentMode?: boolean;
  isLLMConfigured?: boolean;
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
}: EditorFrameProps) {
  const contentRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef({ pointerOffset: 0, dividerMarginStart: 0 });
  const [prefs, setPrefs] = useState<LayoutPrefs>(() => ({
    splitRatio: DEFAULT_SPLIT_RATIO,
    leftCollapsed: false,
    rightCollapsed: typeof window !== "undefined" && window.innerWidth < 768,
  }));
  const [isDragging, setIsDragging] = useState(false);
  const [isLeftHovered, setIsLeftHovered] = useState(false);
  const toggleLeftCollapse = () => {
    setPrefs((prev) => {
      const leftCollapsed = !prev.leftCollapsed;
      return {
        ...prev,
        leftCollapsed,
        rightCollapsed: leftCollapsed ? false : prev.rightCollapsed,
      };
    });
  };

  const toggleRightCollapse = () => {
    setPrefs((prev) => {
      const rightCollapsed = !prev.rightCollapsed;
      return {
        ...prev,
        leftCollapsed: rightCollapsed ? false : prev.leftCollapsed,
        rightCollapsed,
      };
    });
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
    const divider = e.currentTarget;
    const dividerRect = divider.getBoundingClientRect();
    const dividerStyles = window.getComputedStyle(divider);
    dragRef.current = {
      pointerOffset: e.clientX - dividerRect.left,
      dividerMarginStart: parseFloat(dividerStyles.marginLeft) || 0,
    };
    setIsDragging(true);
  };

  useEffect(() => {
    if (!isDragging) return;

    function handleMouseMove(e: MouseEvent) {
      if (!contentRef.current) return;
      const rect = contentRef.current.getBoundingClientRect();
      const styles = window.getComputedStyle(contentRef.current);
      const paddingLeft = parseFloat(styles.paddingLeft) || 0;
      const paddingRight = parseFloat(styles.paddingRight) || 0;
      const contentLeft = rect.left + paddingLeft;
      const contentWidth = rect.width - paddingLeft - paddingRight;
      if (contentWidth <= 0) return;

      const dividerLeft =
        e.clientX -
        dragRef.current.pointerOffset -
        dragRef.current.dividerMarginStart;
      const newRatio = ((dividerLeft - contentLeft) / contentWidth) * 100;
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
  const rightWidth = rightCollapsed ? 0 : leftCollapsed ? 100 : 100 - splitRatio;
  const showDivider = !leftCollapsed;

  return (
    <div className={`editor-shell relative flex h-screen flex-col overflow-hidden bg-[#f6f6f4] ${isDragging ? "select-none" : ""}`}>
      <style>{`
        .editor-form-pane[data-left-hovered="true"] [data-editor-toolbar-inner] {
          border-bottom-color: rgb(0 0 0 / 0.18);
          transition: border-bottom-color 0.2s ease-in-out;
        }
      `}</style>
      <div className="pointer-events-none absolute inset-0 z-0 bg-[linear-gradient(90deg,rgba(0,0,0,0.025)_1px,transparent_1px),linear-gradient(180deg,rgba(0,0,0,0.022)_1px,transparent_1px)] bg-[size:40px_40px] opacity-45" />

      <FadeContent className="relative z-30 shrink-0" duration={520} threshold={0} initialOpacity={0}>
        {toolbar}
      </FadeContent>

      <div ref={contentRef} className="relative z-10 flex min-h-0 flex-1 overflow-hidden">
        {/* Left: Form panel */}
        {!leftCollapsed && (
          <AnimatedContent
            distance={18}
            direction="horizontal"
            reverse
            duration={0.42}
            threshold={0}
            className="editor-form-pane relative z-10 flex shrink-0 flex-col overflow-hidden border-r border-black/10 bg-white/90 transition-colors"
            style={{ width: `${leftWidth}%` }}
            data-left-hovered={isLeftHovered ? "true" : "false"}
            onMouseEnter={() => setIsLeftHovered(true)}
            onMouseLeave={() => setIsLeftHovered(false)}
          >
            {/* Top action bar */}
            <div className="flex h-9 shrink-0 items-center justify-between border-b border-black/10 bg-[#fbfbfa] px-2.5 transition-colors" data-editor-toolbar-inner>
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
          </AnimatedContent>
        )}

        {/* Collapsed left panel button */}
        {leftCollapsed && (
          <div className="flex shrink-0 items-start border-r border-black/10 bg-white px-1.5 pt-2.5">
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
            className={`w-1.5 cursor-col-resize border-x border-transparent transition-colors ${
              isDragging ? "bg-foreground/30" : "bg-black/5 hover:bg-foreground/20"
            }`}
          />
        )}

        {/* Right: Preview panel */}
        {!rightCollapsed && (
          <AnimatedContent
            distance={18}
            direction="horizontal"
            duration={0.42}
            delay={0.03}
            threshold={0}
            className="relative flex flex-1 flex-col overflow-hidden bg-[#f2f2ef]"
            style={{ width: `${rightWidth}%` }}
          >
            <div className="flex-1 overflow-y-auto">{preview}</div>
          </AnimatedContent>
        )}

        {/* Collapsed right panel button */}
        {rightCollapsed && (
          <div className="flex shrink-0 items-center border-l border-black/10 bg-white px-1.5">
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
