"use client";

import ReactMarkdown, { type Components } from "react-markdown";
import remarkGfm from "remark-gfm";
import { ChevronRight, Eye, FilePenLine, RotateCcw, WandSparkles } from "lucide-react";
import FadeContent from "@/components/FadeContent";
import ShinyText from "@/components/ShinyText";
import SpotlightCard from "@/components/SpotlightCard";
import { Button } from "@/components/ui/button";
import type { AgentStatus } from "@/lib/agent/chat";
import type { AgentChange } from "@/lib/agent/change-tracking";
import type { AgentContextUsage } from "@/lib/agent/context-usage";

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

const markdownClassNames = {
  assistant: "w-full min-w-0 break-words text-sm text-gray-950",
  reasoning: [
    "w-full min-w-0 whitespace-pre-wrap break-words text-[11px] leading-5 text-gray-500",
    "[&_p]:mb-2 [&_p]:leading-5",
    "[&_ul]:mb-2 [&_ul]:space-y-1",
    "[&_ol]:mb-2 [&_ol]:space-y-1",
    "[&_li]:leading-5",
    "[&_strong]:text-gray-700",
    "[&_code]:text-[11px] [&_code]:text-gray-700",
    "[&_pre]:mb-2 [&_pre]:p-2",
    "[&_blockquote]:mb-2 [&_blockquote]:text-gray-500",
    "[&_table]:min-w-[420px] [&_table]:text-[11px]",
    "[&_th]:px-2 [&_th]:py-1.5 [&_th]:text-gray-700",
    "[&_td]:px-2 [&_td]:py-1.5 [&_td]:text-gray-500",
    "[&_h1]:mb-2 [&_h1]:text-sm [&_h1]:font-semibold [&_h1]:text-gray-700",
    "[&_h2]:mb-1.5 [&_h2]:text-xs [&_h2]:font-semibold [&_h2]:text-gray-700",
    "[&_h3]:mb-1 [&_h3]:font-semibold [&_h3]:text-gray-700",
    "[&_h4]:mb-1 [&_h4]:font-semibold [&_h4]:text-gray-700",
    "[&_h5]:mb-1 [&_h5]:font-semibold [&_h5]:text-gray-700",
    "[&_h6]:mb-1 [&_h6]:font-semibold [&_h6]:text-gray-700",
    "[&_hr]:my-2 [&_hr]:border-gray-200",
  ].join(" "),
} as const;

function MarkdownContent({
  content,
  streaming = false,
  variant,
}: {
  content: string;
  streaming?: boolean;
  variant: keyof typeof markdownClassNames;
}) {
  return (
    <div className={markdownClassNames[variant]}>
      <ReactMarkdown components={markdownComponents} remarkPlugins={[remarkGfm]}>
        {content}
      </ReactMarkdown>
      {streaming && <span className="animate-pulse">▌</span>}
    </div>
  );
}

export function AssistantMarkdown({
  content,
  streaming = false,
}: {
  content: string;
  streaming?: boolean;
}) {
  return (
    <MarkdownContent
      content={content}
      streaming={streaming}
      variant="assistant"
    />
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

export function ContextUsageIndicator({
  usage,
  label,
}: {
  usage: AgentContextUsage | null;
  label: string;
}) {
  const radius = 10;
  const circumference = 2 * Math.PI * radius;
  const percentage = usage?.maxInputTokens
    ? Math.min(100, Math.max(0, (usage.inputTokens / usage.maxInputTokens) * 100))
    : null;

  return (
    <div
      role={percentage === null ? "status" : "meter"}
      aria-label={label}
      aria-valuemin={percentage === null ? undefined : 0}
      aria-valuemax={percentage === null ? undefined : 100}
      aria-valuenow={percentage === null ? undefined : percentage}
      title={label}
      className="relative flex size-8 shrink-0 items-center justify-center text-gray-950"
    >
      <svg
        viewBox="0 0 28 28"
        className="absolute inset-0 size-full -rotate-90"
        aria-hidden="true"
      >
        <circle
          cx="14"
          cy="14"
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeOpacity="0.1"
          strokeWidth="2.5"
        />
        {percentage !== null && (
          <circle
            cx="14"
            cy="14"
            r={radius}
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={
              circumference - (percentage / 100) * circumference
            }
          />
        )}
      </svg>
      <span className="text-[8px] font-semibold tabular-nums">
        {percentage === null ? "–" : `${Math.round(percentage)}%`}
      </span>
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
  canReview,
  onUndo,
  onReview,
  reviewLabel,
  reviewUnavailableTitle,
  undoLabel,
  undoUnavailableTitle,
}: {
  change: AgentChange;
  latestChangeId?: string;
  canUndo: boolean;
  canReview: boolean;
  onUndo: (change: AgentChange) => void;
  onReview: (change: AgentChange) => void;
  reviewLabel: string;
  reviewUnavailableTitle: string;
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
            disabled={!canReview}
            title={canReview ? reviewLabel : reviewUnavailableTitle}
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
    <div className="flex animate-in justify-end fade-in-0 duration-200 motion-reduce:animate-none">
      <div className="max-w-[85%] whitespace-pre-wrap break-words rounded-2xl border border-black/10 bg-gray-100 px-3 py-2 text-sm leading-6 text-gray-950">
        {content}
      </div>
    </div>
  );
}

export function AssistantMessageBubble({
  content,
  reasoning,
  reasoningLabel,
}: {
  content: string;
  reasoning?: string;
  reasoningLabel: string;
}) {
  return (
    <div className="w-full animate-in py-1 fade-in-0 duration-200 motion-reduce:animate-none">
      {reasoning && (
        <details className="group mb-2 text-gray-500">
          <summary className="flex w-fit cursor-pointer list-none items-center gap-1 text-[11px] font-medium leading-5 hover:text-gray-700 [&::-webkit-details-marker]:hidden">
            <ChevronRight className="size-3 transition-transform group-open:rotate-90" />
            {reasoningLabel}
          </summary>
          <div className="ml-1 mt-1 border-l border-gray-200 pl-3">
            <MarkdownContent content={reasoning} variant="reasoning" />
          </div>
        </details>
      )}
      <AssistantMarkdown content={content} />
    </div>
  );
}
