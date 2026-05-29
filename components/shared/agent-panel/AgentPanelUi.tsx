"use client";

import ReactMarkdown, { type Components } from "react-markdown";
import remarkGfm from "remark-gfm";
import { Eye, FilePenLine, RotateCcw, Shrink, WandSparkles } from "lucide-react";
import AnimatedContent from "@/components/AnimatedContent";
import FadeContent from "@/components/FadeContent";
import ShinyText from "@/components/ShinyText";
import SpotlightCard from "@/components/SpotlightCard";
import { Button } from "@/components/ui/button";
import type { AgentStatus, AgentContextUsage } from "@/lib/agent/chat";
import type { AgentChange } from "@/lib/agent/change-tracking";

const markdownComponents: Components = {
  p: ({ children }) => (
    <p className="mb-3 last:mb-0 leading-6">{children}</p>
  ),
  ul: ({ children }) => (
    <ul className="mb-3 ml-5 list-disc space-y-1.5 last:mb-0">{children}</ul>
  ),
  ol: ({ children }) => (
    <ol className="mb-3 ml-5 list-decimal space-y-1.5 last:mb-0">{children}</ol>
  ),
  li: ({ children }) => (
    <li className="pl-1 leading-6">{children}</li>
  ),
  strong: ({ children }) => (
    <strong className="font-semibold text-gray-950">{children}</strong>
  ),
  em: ({ children }) => (
    <em className="italic">{children}</em>
  ),
  a: ({ children, href }) => (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      className="break-words underline decoration-gray-400 underline-offset-2 hover:decoration-gray-900"
    >
      {children}
    </a>
  ),
  code: ({ children, className }) => {
    const isBlock = className?.includes("language-");
    if (isBlock) {
      return (
        <code className="block whitespace-pre-wrap break-words font-mono text-[12px] leading-5">
          {children}
        </code>
      );
    }

    return (
      <code className="rounded bg-gray-100 px-1 py-0.5 font-mono text-[12px] text-gray-950">
        {children}
      </code>
    );
  },
  pre: ({ children }) => (
    <pre className="mb-3 max-w-full overflow-x-auto rounded-md border border-gray-200 bg-gray-50 p-3 last:mb-0">
      {children}
    </pre>
  ),
  blockquote: ({ children }) => (
    <blockquote className="mb-3 border-l-2 border-gray-300 pl-3 text-gray-700 last:mb-0">
      {children}
    </blockquote>
  ),
  table: ({ children }) => (
    <div className="mb-3 max-w-full overflow-x-auto rounded-lg border border-gray-200 last:mb-0">
      <table className="w-full min-w-[520px] border-collapse text-left text-xs">
        {children}
      </table>
    </div>
  ),
  thead: ({ children }) => <thead className="bg-gray-50">{children}</thead>,
  tr: ({ children }) => (
    <tr className="border-b border-gray-200 last:border-b-0">{children}</tr>
  ),
  th: ({ children }) => (
    <th className="px-3 py-2 font-semibold leading-5 text-gray-950">
      {children}
    </th>
  ),
  td: ({ children }) => (
    <td className="align-top px-3 py-2 leading-5 text-gray-700">
      {children}
    </td>
  ),
};

export function AssistantMarkdown({ content, streaming = false }: { content: string; streaming?: boolean }) {
  return (
    <div className="w-full min-w-0 break-words text-sm text-gray-950">
      <ReactMarkdown components={markdownComponents} remarkPlugins={[remarkGfm]}>
        {content}
      </ReactMarkdown>
      {streaming && <span className="animate-pulse">▌</span>}
    </div>
  );
}

export function AgentAvatar({ size = "md", active = false }: { size?: "sm" | "md" | "lg"; active?: boolean }) {
  const sizeClass = size === "lg" ? "size-10" : size === "sm" ? "size-5" : "size-7";
  const iconClass = size === "lg" ? "size-6" : size === "sm" ? "size-3.5" : "size-4";

  return (
    <div
      className={`agent-avatar ${active ? "agent-avatar-active" : ""} ${sizeClass} relative flex shrink-0 items-center justify-center text-gray-950`}
      aria-hidden="true"
    >
      <WandSparkles className={iconClass} />
    </div>
  );
}

export function AgentEmptyState({
  title,
  description,
  suggestions,
  onPickSuggestion,
}: {
  title: string;
  description: string;
  suggestions: string[];
  onPickSuggestion: (suggestion: string) => void;
}) {
  return (
    <FadeContent
      className="flex h-full items-center justify-center"
      duration={420}
      threshold={0}
      initialOpacity={0}
    >
      <div className="mx-auto flex max-w-sm flex-col items-center px-6 text-center">
        <AgentAvatar size="lg" active />
        <div className="mt-4 text-sm font-semibold text-gray-950">{title}</div>
        <p className="mt-1 text-sm leading-6 text-muted-foreground">{description}</p>
        <div className="mt-4 flex flex-wrap justify-center gap-2">
          {suggestions.map((suggestion) => (
            <button
              key={suggestion}
              type="button"
              onClick={() => onPickSuggestion(suggestion)}
              className="rounded-full border border-black/10 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 transition-colors hover:border-black/30 hover:bg-gray-50 hover:text-gray-950"
            >
              {suggestion}
            </button>
          ))}
        </div>
      </div>
    </FadeContent>
  );
}

export function ContextSummaryMessage({
  content,
  label,
}: {
  content: string;
  label: string;
}) {
  return (
    <div className="flex justify-start py-1">
      <div className="w-full min-w-0 rounded-md border border-dashed border-gray-200 bg-gray-50 px-3 py-2 text-xs text-muted-foreground">
        <div className="mb-2 flex items-center gap-1.5 font-medium text-gray-700">
          <Shrink className="size-3.5" />
          <span>{label}</span>
        </div>
        <div className="text-gray-700">
          <AssistantMarkdown content={content} />
        </div>
      </div>
    </div>
  );
}

export function ContextUsageIndicator({
  usage,
  title,
}: {
  usage: AgentContextUsage | null;
  title: string;
}) {
  const percent = usage?.percent ?? 0;
  const visiblePercent = percent > 0 ? Math.max(percent, 4) : 0;
  const tone =
    percent >= 90
      ? "#ef4444"
      : percent >= 70
        ? "#f59e0b"
        : percent > 0
          ? "#374151"
          : "#d1d5db";

  return (
    <div
      className="flex h-7 w-7 shrink-0 items-center justify-center"
      title={title}
      aria-label={title}
      role="img"
    >
      <div
        className="flex h-[18px] w-[18px] items-center justify-center rounded-full border border-gray-200"
        style={{
          background: `conic-gradient(${tone} ${visiblePercent}%, #e5e7eb ${visiblePercent}% 100%)`,
        }}
        aria-hidden="true"
      >
        <div className="h-2.5 w-2.5 rounded-full bg-card shadow-[inset_0_0_0_1px_rgba(0,0,0,0.04)]" />
      </div>
    </div>
  );
}

export function AgentStatusIndicator({
  status,
  thinkingText,
  workingText,
}: {
  status: AgentStatus;
  thinkingText: string;
  workingText: string;
}) {
  const text = status === "thinking" ? thinkingText : workingText;

  return (
    <div className="flex items-center gap-2.5 py-1 text-xs text-muted-foreground">
      <AgentAvatar size="sm" active />
      <ShinyText text={text} className="font-medium" />
    </div>
  );
}

export function ChangeCard({
  change,
  latestChangeId,
  canUndo,
  onUndo,
  onReview,
  reviewLabel,
  undoLabel,
  undoUnavailableTitle,
}: {
  change: AgentChange;
  latestChangeId?: string;
  canUndo: boolean;
  onUndo: (change: AgentChange) => void;
  onReview: (change: AgentChange) => void;
  reviewLabel: string;
  undoLabel: string;
  undoUnavailableTitle: string;
}) {
  const isLatest = change.id === latestChangeId;
  return (
    <div className="flex justify-center py-1">
      <SpotlightCard
        className="rounded-full border border-black/10 bg-white"
        spotlightColor="rgba(0, 0, 0, 0.055)"
      >
        <div className="flex items-center gap-2 px-2.5 py-1.5 text-xs text-gray-700">
          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-gray-100 text-gray-700">
            <FilePenLine className="size-3.5" />
          </div>
          <span className="font-medium text-emerald-700">+{change.addedWords}</span>
          <span className="font-medium text-red-700">-{change.removedWords}</span>
          <Button
            variant="ghost"
            size="sm"
            className="h-7 gap-1 px-2 text-xs"
            onClick={() => onUndo(change)}
            disabled={!isLatest || !canUndo}
            title={!isLatest || !canUndo ? undoUnavailableTitle : undoLabel}
          >
            <RotateCcw className="size-3.5" />
            {undoLabel}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-7 gap-1 px-2 text-xs"
            onClick={() => onReview(change)}
          >
            <Eye className="size-3.5" />
            {reviewLabel}
          </Button>
        </div>
      </SpotlightCard>
    </div>
  );
}

export function UserMessageBubble({ content }: { content: string }) {
  return (
    <AnimatedContent
      distance={10}
      duration={0.28}
      threshold={0}
      className="flex justify-end"
    >
      <div className="max-w-[85%] whitespace-pre-wrap break-words rounded-2xl border border-black/10 bg-gray-100 px-3 py-2 text-sm leading-6 text-gray-950">
        {content}
      </div>
    </AnimatedContent>
  );
}

export function AssistantMessageBubble({ content }: { content: string }) {
  return (
    <AnimatedContent
      distance={10}
      duration={0.28}
      threshold={0}
      className="w-full py-1"
    >
      <AssistantMarkdown content={content} />
    </AnimatedContent>
  );
}
