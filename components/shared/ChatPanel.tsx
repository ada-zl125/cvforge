"use client";

import { useEffect, useRef, useState, type Dispatch, type SetStateAction } from "react";
import ReactMarkdown, { type Components } from "react-markdown";
import remarkGfm from "remark-gfm";
import { Send, SlidersHorizontal, Loader2, AlertCircle, Settings, Eraser, Shrink, RotateCcw, Eye, FilePenLine, WandSparkles, Square, Paperclip, LinkIcon, Trash2, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import AnimatedContent from "@/components/AnimatedContent";
import FadeContent from "@/components/FadeContent";
import ShinyText from "@/components/ShinyText";
import SpotlightCard from "@/components/SpotlightCard";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  compactAgentHistory,
  estimateAgentContextUsage,
  runAgentStream,
  type AgentContextUsage,
  type AgentStatus,
  type Message,
} from "@/lib/agent/chat";
import {
  isLLMConfigComplete,
  readLLMConfig,
  type LLMConfig,
  writeLLMConfig,
} from "@/lib/agent/config";
import type { ClarificationRequest, DocType } from "@/lib/agent/tools";
import { buildAgentChange, contentSignature, type AgentChange } from "@/lib/agent/change-tracking";
import {
  CONTEXT_MAX_FILE_BYTES,
  CONTEXT_MAX_FILE_SOURCES,
  isLinkedInProfileUrl,
  isSupportedTextFile,
  truncateContextText,
  type AgentContextSource,
} from "@/lib/agent/context-sources";
import { useUILanguage } from "@/lib/ui-language";
import { t } from "@/lib/translations";

export interface AgentPanelState {
  messages: Message[];
  activeConfig: LLMConfig | null;
  draftConfig: LLMConfig;
  pendingClarification: PendingClarification | null;
  lastChange: AgentChange | null;
  contextSources: AgentContextSource[];
}

interface PendingClarification {
  id: string;
  originalUserMessage: string;
  request: ClarificationRequest;
  history: Message[];
  documentState: unknown;
  clarificationCount: number;
}

const MAX_CLARIFICATION_ROUNDS = 2;

export function createInitialAgentPanelState(): AgentPanelState {
  return {
    messages: [],
    activeConfig: null,
    draftConfig: {
      baseURL: "",
      apiKey: "",
      model: "",
    },
    pendingClarification: null,
    lastChange: null,
    contextSources: [],
  };
}

interface ChatPanelProps<TContent> {
  docType: DocType;
  content: TContent;
  onChange: (content: TContent) => void;
  onReviewChange?: (change: AgentChange | null) => void;
  onAgentRunningChange?: (running: boolean) => void;
  agentState: AgentPanelState;
  onAgentStateChange: Dispatch<SetStateAction<AgentPanelState>>;
}

async function validateLLMConfig(config: LLMConfig): Promise<void> {
  const baseURL = config.baseURL.replace(/\/+$/, "");
  const response = await fetch(`${baseURL}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${config.apiKey}`,
    },
    body: JSON.stringify({
      model: config.model,
      messages: [{ role: "user", content: "ping" }],
      max_tokens: 10,
    }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    const errorMsg =
      errorData.error?.message ||
      `API Error: ${response.status} ${response.statusText}`;
    throw new Error(errorMsg);
  }
}

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

function AssistantMarkdown({ content, streaming = false }: { content: string; streaming?: boolean }) {
  return (
    <div className="w-full min-w-0 break-words text-sm text-gray-950">
      <ReactMarkdown components={markdownComponents} remarkPlugins={[remarkGfm]}>
        {content}
      </ReactMarkdown>
      {streaming && <span className="animate-pulse">▌</span>}
    </div>
  );
}

function AgentAvatar({ size = "md", active = false }: { size?: "sm" | "md" | "lg"; active?: boolean }) {
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

function AgentEmptyState({
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

function ContextSummaryMessage({
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

function ContextUsageIndicator({
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

function formatClarificationMessage(request: ClarificationRequest, lang: "en" | "zh"): string {
  const scope = request.field || request.section;
  if (lang === "zh") {
    const reason = request.reason ? `原因：${request.reason}` : "";
    const target = scope ? `\n\n相关位置：${scope}` : "";
    return `我需要先确认一个细节：${request.question}\n\n${reason}${target}`.trim();
  }

  const reason = request.reason ? `Reason: ${request.reason}` : "";
  const target = scope ? `\n\nRelated field: ${scope}` : "";
  return `I need to confirm one detail first: ${request.question}\n\n${reason}${target}`.trim();
}

function AgentStatusIndicator({
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

function ChangeCard({
  change,
  latestChangeId,
  canUndo,
  onUndo,
  onReview,
  reviewLabel,
}: {
  change: AgentChange;
  latestChangeId?: string;
  canUndo: boolean;
  onUndo: (change: AgentChange) => void;
  onReview: (change: AgentChange) => void;
  reviewLabel: string;
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
          title={!isLatest || !canUndo ? "Undo is only available for the latest unchanged agent edit" : "Undo"}
        >
          <RotateCcw className="size-3.5" />
          Undo
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

export function ChatPanel<TContent>({
  docType,
  content,
  onChange,
  onReviewChange,
  onAgentRunningChange,
  agentState,
  onAgentStateChange,
}: ChatPanelProps<TContent>) {
  const { lang } = useUILanguage();
  const tr = t[lang];
  const agentTr = tr.agent;

  const { messages, activeConfig, draftConfig, pendingClarification, lastChange, contextSources = [] } = agentState;
  const [streamingText, setStreamingText] = useState("");
  const [agentStatus, setAgentStatus] = useState<AgentStatus | null>(null);
  const [inputValue, setInputValue] = useState("");
  const [clarificationAnswer, setClarificationAnswer] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isCompacting, setIsCompacting] = useState(false);
  const [isSavingConfig, setIsSavingConfig] = useState(false);
  const [configOpen, setConfigOpen] = useState(false);
  const [contextOpen, setContextOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isHoveringChat, setIsHoveringChat] = useState(false);
  const [linkedinUrl, setLinkedinUrl] = useState("");
  const [contextError, setContextError] = useState<string | null>(null);
  const [isAddingLink, setIsAddingLink] = useState(false);

  const [configError, setConfigError] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesRef = useRef(messages);
  const contentRef = useRef(content);
  const streamingTextRef = useRef("");
  const abortControllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);

  useEffect(() => {
    contentRef.current = content;
  }, [content]);

  useEffect(() => {
    return () => {
      abortControllerRef.current?.abort();
      onAgentRunningChange?.(false);
    };
  }, [onAgentRunningChange]);

  useEffect(() => {
    onAgentRunningChange?.(isLoading);
  }, [isLoading, onAgentRunningChange]);

  // Reset config when re-entering page (docType change)
  useEffect(() => {
    setConfigError(null);
  }, [docType]);

  useEffect(() => {
    const syncStoredConfig = () => {
      const storedConfig = readLLMConfig();
      if (!isLLMConfigComplete(storedConfig)) return;

      onAgentStateChange((prev) => {
        if (isLLMConfigComplete(prev.activeConfig)) return prev;
        return {
          ...prev,
          activeConfig: storedConfig,
          draftConfig: isLLMConfigComplete(prev.draftConfig)
            ? prev.draftConfig
            : storedConfig,
        };
      });
    };

    syncStoredConfig();
    window.addEventListener("llm-config-change", syncStoredConfig);
    return () => {
      window.removeEventListener("llm-config-change", syncStoredConfig);
    };
  }, [onAgentStateChange]);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [agentStatus, messages, streamingText]);

  const setMessages = (updater: SetStateAction<Message[]>) => {
    const nextMessages =
      typeof updater === "function"
        ? (updater as (messages: Message[]) => Message[])(messagesRef.current)
        : updater;

    messagesRef.current = nextMessages;
    onAgentStateChange((prev) => ({
      ...prev,
      messages: nextMessages,
    }));
  };

  const setDraftConfig = (updater: SetStateAction<LLMConfig>) => {
    onAgentStateChange((prev) => ({
      ...prev,
      draftConfig:
        typeof updater === "function"
          ? (updater as (config: LLMConfig) => LLMConfig)(prev.draftConfig)
          : updater,
    }));
  };

  const setActiveConfig = (config: LLMConfig | null) => {
    onAgentStateChange((prev) => ({
      ...prev,
      activeConfig: config,
    }));
  };

  const setPendingClarification = (pending: PendingClarification | null) => {
    onAgentStateChange((prev) => ({
      ...prev,
      pendingClarification: pending,
    }));
  };

  const setContextSources = (updater: SetStateAction<AgentContextSource[]>) => {
    onAgentStateChange((prev) => {
      const current = prev.contextSources ?? [];
      return {
        ...prev,
        contextSources:
          typeof updater === "function"
            ? (updater as (sources: AgentContextSource[]) => AgentContextSource[])(current)
            : updater,
      };
    });
  };

  const isConfigured = !!activeConfig;
  const isBusy = isLoading || isCompacting;
  const hasPendingClarification = !!pendingClarification;
  const isChatDisabled = !isConfigured || isBusy || hasPendingClarification;
  const hasChatContext = messages.length > 0 || streamingText !== "";
  const contextUsage = activeConfig
    ? estimateAgentContextUsage({
        model: activeConfig.model,
        docType,
        content,
        history: messages,
        referenceSources: contextSources,
      })
    : null;
  const canUndoLastChange =
    !!lastChange && contentSignature(content) === lastChange.afterSignature;
  const agentDocLabel =
    docType === "cover-letter"
      ? agentTr.coverLetter
      : docType === "academic-cv"
        ? agentTr.academicCv
        : agentTr.resume;
  const promptSuggestions =
    lang === "zh"
      ? [
          "帮我润色项目经历",
          "让表达更有说服力",
          "检查是否适合一页",
        ]
      : [
          "Polish my project bullets",
          "Make the tone stronger",
          "Check if this fits one page",
        ];

  const setLastChange = (change: AgentChange | null) => {
    onAgentStateChange((prev) => ({
      ...prev,
      lastChange: change,
    }));
  };

  const recordAgentChange = (before: unknown, after: unknown, toolNames: string[]) => {
    const change = buildAgentChange(before, after, toolNames);
    if (!change) return;

    setLastChange(change);
    onReviewChange?.(null);
    setMessages((prev) => [
      ...prev,
      {
        role: "assistant",
        kind: "change-card",
        content: "",
        change,
      },
    ]);
  };

  const isAbortError = (err: unknown) =>
    err instanceof Error && err.name === "AbortError";

  const handleCancelRunningTask = () => {
    abortControllerRef.current?.abort();
    setAgentStatus(null);
  };

  const handleUndoChange = (change: AgentChange) => {
    if (change.id !== lastChange?.id || contentSignature(contentRef.current) !== change.afterSignature) return;

    contentRef.current = change.before as TContent;
    onChange(change.before as TContent);
    setLastChange(null);
    onReviewChange?.(null);
    setMessages((prev) => [
      ...prev,
      {
        role: "assistant",
        content: agentTr.undoChangeNotice,
      },
    ]);
  };

  const handleReviewChange = (change: AgentChange) => {
    onReviewChange?.(null);
    window.setTimeout(() => onReviewChange?.(change), 0);
  };

  const handleClearContext = () => {
    if (isBusy || !hasChatContext) return;

    setMessages([]);
    setStreamingText("");
    streamingTextRef.current = "";
    setAgentStatus(null);
    setError(null);
    setPendingClarification(null);
    setClarificationAnswer("");
    setLastChange(null);
    onReviewChange?.(null);
  };

  const handleCompactContext = async () => {
    if (isBusy || hasPendingClarification || !activeConfig || !isLLMConfigComplete(activeConfig) || messages.length === 0) return;

    setError(null);
    setIsCompacting(true);
    setAgentStatus("thinking");

    try {
      const summary = await compactAgentHistory({
        config: activeConfig,
        docType,
        content: contentRef.current,
        history: messages,
      });

      setMessages([
        {
          role: "assistant",
          kind: "context-summary",
          content: summary,
        },
      ]);
      setStreamingText("");
      streamingTextRef.current = "";
      setAgentStatus(null);
    } catch (err) {
      let errorMsg: string = agentTr.compactFailed;

      if (err instanceof Error) {
        errorMsg = err.message;
      }

      if (
        errorMsg.includes("401") ||
        errorMsg.includes("403") ||
        errorMsg.includes("unauthorized") ||
        errorMsg.includes("invalid") ||
        errorMsg.includes("api key") ||
        errorMsg.includes("authentication")
      ) {
        errorMsg = agentTr.invalidConfig;
        setActiveConfig(null);
      }

      setError(errorMsg);
      setAgentStatus(null);
    } finally {
      setIsCompacting(false);
    }
  };

  const handleSend = async () => {
    const userMsg = inputValue.trim();
    if (!userMsg || isLoading) return;

    if (!activeConfig || !isLLMConfigComplete(activeConfig)) {
      setMessages((prev) => [
        ...prev,
        { role: "user", content: userMsg },
        { role: "assistant", content: agentTr.invalidConfig },
      ]);
      setInputValue("");
      return;
    }

    setError(null);
    setIsLoading(true);
    setAgentStatus("thinking");
    setInputValue("");
    const abortController = new AbortController();
    abortControllerRef.current = abortController;
    const beforeContent = contentRef.current;
    let latestContent = beforeContent;
    const changedToolNames: string[] = [];

    try {
      const history = messagesRef.current;
      const nextMessages: Message[] = [...history, { role: "user", content: userMsg }];
      setMessages(nextMessages);
      setStreamingText("");
      streamingTextRef.current = "";

      await runAgentStream({
        config: activeConfig,
        docType,
        getContent: () => contentRef.current,
        onContentUpdate: (updated, toolName) => {
          contentRef.current = updated;
          latestContent = updated;
          changedToolNames.push(toolName);
          onChange(updated);
        },
        history,
        userMessage: userMsg,
        referenceSources: contextSources,
        signal: abortController.signal,
        onTextChunk: (chunk) => {
          setAgentStatus(null);
          streamingTextRef.current += chunk;
          setStreamingText((prev) => prev + chunk);
        },
        onStatusChange: setAgentStatus,
        onClarification: (request) => {
          setPendingClarification({
            id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
            originalUserMessage: userMsg,
            request,
            history: nextMessages,
            documentState: contentRef.current,
            clarificationCount: 1,
          });
        },
        onDone: () => {
          if (streamingTextRef.current) {
            setMessages((prev) => [
              ...prev,
              {
                role: "assistant",
                content: streamingTextRef.current,
              },
            ]);
          }
          setAgentStatus(null);
          streamingTextRef.current = "";
          setStreamingText("");
          recordAgentChange(beforeContent, latestContent, changedToolNames);
        },
      });
    } catch (err) {
      if (isAbortError(err)) {
        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            content: agentTr.taskCanceled,
          },
        ]);
        streamingTextRef.current = "";
        setStreamingText("");
        setAgentStatus(null);
        recordAgentChange(beforeContent, latestContent, changedToolNames);
        return;
      }

      let errorMsg: string = agentTr.requestFailed;

      if (err instanceof Error) {
        errorMsg = err.message;
      }

      // Check if it's a config-related error
      if (
        errorMsg.includes("401") ||
        errorMsg.includes("403") ||
        errorMsg.includes("unauthorized") ||
        errorMsg.includes("invalid") ||
        errorMsg.includes("api key") ||
        errorMsg.includes("authentication")
      ) {
        errorMsg = agentTr.invalidConfig;
        setActiveConfig(null);
      }

      setError(errorMsg);
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: errorMsg,
        },
      ]);
      streamingTextRef.current = "";
      setStreamingText("");
      setAgentStatus(null);
    } finally {
      if (abortControllerRef.current === abortController) {
        abortControllerRef.current = null;
      }
      setIsLoading(false);
    }
  };

  const handleContinueClarification = async () => {
    const pending = pendingClarification;
    const answer = clarificationAnswer.trim();
    if (!pending || !answer || isLoading) return;

    if (!activeConfig || !isLLMConfigComplete(activeConfig)) {
      setError(agentTr.invalidConfig);
      setActiveConfig(null);
      return;
    }

    const canAskAnotherClarification = pending.clarificationCount < MAX_CLARIFICATION_ROUNDS;
    const continuationMessage = [
      `User answered the clarification: ${answer}`,
      `Clarification question: ${pending.request.question}`,
      `Continue the original task: ${pending.originalUserMessage}`,
      pending.request.section ? `Clarification section scope: ${pending.request.section}` : null,
      pending.request.field ? `Clarification field scope: ${pending.request.field}` : null,
      `Clarification round: ${pending.clarificationCount}`,
      "Use the answer to resolve only the pending uncertainty.",
      "If the original task now has enough required information, stop asking questions, call the document update tools, and reply with a normal completion message.",
      "Stay within the same requested section scope for any further clarification. Do not ask about other sections unless the user's original task explicitly requested them.",
      canAskAnotherClarification
        ? "Only call ask_user again when another required detail from the same original task is still missing, cannot be inferred, and cannot be safely omitted. If you ask again, ask exactly one small question."
        : "Do not call ask_user again. If a detail is still missing, make the safest partial update or ask in normal chat.",
    ].filter(Boolean).join("\n");
    const visibleAnswer =
      lang === "zh"
        ? `补充确认：${answer}`
        : `Clarification: ${answer}`;
    const historyWithQuestion: Message[] = [
      ...pending.history,
      {
        role: "assistant",
        content: formatClarificationMessage(pending.request, lang),
      },
    ];

    setError(null);
    setIsLoading(true);
    setAgentStatus("thinking");
    setClarificationAnswer("");
    setPendingClarification(null);
    setMessages((prev) => [...prev, { role: "user", content: visibleAnswer }]);
    setStreamingText("");
    streamingTextRef.current = "";
    const abortController = new AbortController();
    abortControllerRef.current = abortController;
    const beforeContent = contentRef.current;
    let latestContent = beforeContent;
    const changedToolNames: string[] = [];

    try {
      await runAgentStream({
        config: activeConfig,
        docType,
        getContent: () => contentRef.current,
        onContentUpdate: (updated, toolName) => {
          contentRef.current = updated;
          latestContent = updated;
          changedToolNames.push(toolName);
          onChange(updated);
        },
        history: historyWithQuestion,
        userMessage: continuationMessage,
        referenceSources: contextSources,
        signal: abortController.signal,
        onTextChunk: (chunk) => {
          setAgentStatus(null);
          streamingTextRef.current += chunk;
          setStreamingText((prev) => prev + chunk);
        },
        onStatusChange: setAgentStatus,
        onClarification: (request) => {
          setPendingClarification({
            id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
            originalUserMessage: pending.originalUserMessage,
            request,
            history: [
              ...historyWithQuestion,
              { role: "user", content: continuationMessage },
            ],
            documentState: contentRef.current,
            clarificationCount: pending.clarificationCount + 1,
          });
        },
        onDone: () => {
          if (streamingTextRef.current) {
            setMessages((prev) => [
              ...prev,
              {
                role: "assistant",
                content: streamingTextRef.current,
              },
            ]);
          }
          setAgentStatus(null);
          streamingTextRef.current = "";
          setStreamingText("");
          recordAgentChange(beforeContent, latestContent, changedToolNames);
        },
      });
    } catch (err) {
      if (isAbortError(err)) {
        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            content: agentTr.taskCanceled,
          },
        ]);
        streamingTextRef.current = "";
        setStreamingText("");
        setAgentStatus(null);
        recordAgentChange(beforeContent, latestContent, changedToolNames);
        return;
      }

      let errorMsg: string = agentTr.requestFailed;

      if (err instanceof Error) {
        errorMsg = err.message;
      }

      if (
        errorMsg.includes("401") ||
        errorMsg.includes("403") ||
        errorMsg.includes("unauthorized") ||
        errorMsg.includes("invalid") ||
        errorMsg.includes("api key") ||
        errorMsg.includes("authentication")
      ) {
        errorMsg = agentTr.invalidConfig;
        setActiveConfig(null);
      }

      setError(errorMsg);
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: errorMsg,
        },
      ]);
      streamingTextRef.current = "";
      setStreamingText("");
      setAgentStatus(null);
    } finally {
      if (abortControllerRef.current === abortController) {
        abortControllerRef.current = null;
      }
      setIsLoading(false);
    }
  };

  const handleCancelClarification = () => {
    if (!pendingClarification || isLoading) return;

    setPendingClarification(null);
    setClarificationAnswer("");
    setAgentStatus(null);
    setMessages((prev) => [
      ...prev,
      {
        role: "assistant",
        content: agentTr.clarificationCanceled,
      },
    ]);
  };

  const handleFileContextUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files ?? []);
    event.target.value = "";
    if (files.length === 0) return;

    setContextError(null);

    const nextSources: AgentContextSource[] = [];
    const existingFileCount = contextSources.filter((source) => source.type === "file").length;
    const availableFileSlots = Math.max(0, CONTEXT_MAX_FILE_SOURCES - existingFileCount);
    if (availableFileSlots <= 0) {
      setContextError(agentTr.contextTooManyFiles(CONTEXT_MAX_FILE_SOURCES));
      return;
    }

    const selectedFiles = files.slice(0, availableFileSlots);
    if (files.length > availableFileSlots) {
      setContextError(agentTr.contextTooManyFiles(CONTEXT_MAX_FILE_SOURCES));
    }

    for (const file of selectedFiles) {
      if (!isSupportedTextFile(file)) {
        setContextError(agentTr.contextUnsupportedFile(file.name));
        continue;
      }

      if (file.size > CONTEXT_MAX_FILE_BYTES) {
        setContextError(agentTr.contextFileTooLarge(file.name));
        continue;
      }

      try {
        const text = truncateContextText(await file.text());
        if (!text) {
          setContextError(agentTr.contextEmptyFile(file.name));
          continue;
        }

        nextSources.push({
          id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
          type: "file",
          name: file.name,
          text,
          size: file.size,
          createdAt: Date.now(),
        });
      } catch {
        setContextError(agentTr.contextReadFailed(file.name));
      }
    }

    if (nextSources.length > 0) {
      setContextSources((prev) => [...prev, ...nextSources].slice(-8));
    }
  };

  const handleAddLinkedInContext = async () => {
    const url = linkedinUrl.trim();
    if (!url || isAddingLink) return;

    if (!isLinkedInProfileUrl(url)) {
      setContextError(agentTr.contextInvalidLinkedIn);
      return;
    }

    setIsAddingLink(true);
    setContextError(null);

    try {
      const response = await fetch("/api/context/linkedin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
      });
      const data = await response.json().catch(() => ({}));

      if (!response.ok || typeof data.text !== "string") {
        throw new Error(typeof data.error === "string" ? data.error : agentTr.contextLinkedInFailed);
      }

      const profileName = new URL(url).pathname.split("/").filter(Boolean).at(1) ?? "LinkedIn profile";
      const source: AgentContextSource = {
        id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
        type: "linkedin",
        name: `LinkedIn: ${profileName}`,
        url,
        text: truncateContextText(data.text),
        createdAt: Date.now(),
      };
      setContextSources((prev) => [
        ...prev,
        source,
      ].slice(-8));
      setLinkedinUrl("");
    } catch (err) {
      setContextError(err instanceof Error ? err.message : agentTr.contextLinkedInFailed);
    } finally {
      setIsAddingLink(false);
    }
  };

  const handleConfigSave = async () => {
    if (!isLLMConfigComplete(draftConfig)) {
      setConfigError(agentTr.fillAllFields);
      return;
    }

    setIsSavingConfig(true);
    setConfigError(null);
    try {
      const nextConfig = {
        baseURL: draftConfig.baseURL.trim().replace(/\/+$/, ""),
        apiKey: draftConfig.apiKey.trim(),
        model: draftConfig.model.trim(),
      };

      await validateLLMConfig(nextConfig);
      writeLLMConfig(nextConfig);
      onAgentStateChange((prev) => ({
        ...prev,
        draftConfig: nextConfig,
        activeConfig: nextConfig,
      }));
      setConfigOpen(false);
      setConfigError(null);
      setError(null);
    } catch {
      setConfigError(agentTr.invalidConfigForm);
    } finally {
      setIsSavingConfig(false);
    }
  };

  return (
    <div className="flex h-full flex-col bg-[#fbfbfa]">
      {/* Top bar */}
      <SpotlightCard
        className="shrink-0 border-b border-black/10 bg-white"
        spotlightColor="rgba(0, 0, 0, 0.045)"
      >
      <div className="flex items-center justify-between px-3 py-2.5">
        <div className="flex min-w-0 items-center gap-2.5">
          <AgentAvatar active={isConfigured} />
          <div className="min-w-0">
            <h2 className="text-sm font-semibold leading-5 text-gray-950">{agentTr.agentMode}</h2>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <ContextUsageIndicator
            usage={contextUsage}
            title={
              contextUsage
                ? agentTr.contextUsageTitle(
                    contextUsage.percent,
                    contextUsage.usedTokens,
                    contextUsage.maxTokens
                  )
                : agentTr.contextUsageUnavailableTitle
            }
          />
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={handleCompactContext}
            disabled={!isConfigured || isBusy || hasPendingClarification || messages.length === 0}
            className="text-muted-foreground hover:text-foreground disabled:pointer-events-none disabled:opacity-35"
            title={isCompacting ? agentTr.compactingContextTitle : agentTr.compactContextTitle}
          >
            {isCompacting ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Shrink className="size-4" />
            )}
          </Button>
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={handleClearContext}
            disabled={isBusy || !hasChatContext}
            className="text-muted-foreground hover:text-foreground disabled:pointer-events-none disabled:opacity-35"
            title={agentTr.clearContextTitle}
          >
            <Eraser className="size-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={() => {
              setContextOpen(true);
              setContextError(null);
            }}
            disabled={isBusy}
            className="relative text-muted-foreground hover:text-foreground disabled:pointer-events-none disabled:opacity-35"
            title={agentTr.contextTitle}
          >
            <Paperclip className="size-4" />
            {contextSources.length > 0 && (
              <span className="absolute -right-0.5 -top-0.5 flex h-3.5 min-w-3.5 items-center justify-center rounded-full bg-black px-1 text-[9px] font-semibold leading-none text-white">
                {contextSources.length}
              </span>
            )}
          </Button>
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={() => setConfigOpen(true)}
            disabled={hasPendingClarification}
            className="text-muted-foreground hover:text-foreground"
            title={agentTr.configureTitle}
          >
            <SlidersHorizontal className="size-4" />
          </Button>
        </div>
      </div>
      </SpotlightCard>

      {/* Messages */}
      <div
        className={`flex-1 overflow-y-auto flex flex-col gap-3 p-4 border-y transition-colors duration-200 ${
          isConfigured && isHoveringChat
            ? "border-y-gray-300"
            : "border-y border-transparent"
        }`}
        onMouseEnter={() => isConfigured && setIsHoveringChat(true)}
        onMouseLeave={() => setIsHoveringChat(false)}
      >
        {!isConfigured ? (
          <FadeContent duration={360} threshold={0} initialOpacity={0}>
            <SpotlightCard
              className="rounded-md border border-dashed border-black/12 bg-white px-3 py-3"
              spotlightColor="rgba(0, 0, 0, 0.05)"
            >
              <div className="flex items-start gap-3 text-sm text-muted-foreground">
                <AlertCircle className="size-4 shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium mb-1 text-gray-950">
                    {agentTr.configurePanelTitle}
                  </p>
                  <p>{agentTr.configureHint}</p>
                </div>
              </div>
            </SpotlightCard>
          </FadeContent>
        ) : messages.length === 0 && streamingText === "" ? (
          <AgentEmptyState
            title={agentTr.emptyTitle}
            description={agentTr.startConversation(agentDocLabel)}
            suggestions={promptSuggestions}
            onPickSuggestion={setInputValue}
          />
        ) : (
          <>
            {messages.map((msg, idx) => {
              const isUser = msg.role === "user";

              if (msg.kind === "context-summary") {
                return (
                  <ContextSummaryMessage
                    key={idx}
                    content={msg.content}
                    label={agentTr.compactedContextNotice}
                  />
                );
              }

              if (msg.kind === "change-card" && msg.change) {
                return (
                  <ChangeCard
                    key={idx}
                    change={msg.change}
                    latestChangeId={lastChange?.id}
                    canUndo={canUndoLastChange}
                    onUndo={handleUndoChange}
                    onReview={handleReviewChange}
                    reviewLabel={agentTr.reviewChange}
                  />
                );
              }

              if (isUser) {
                return (
                  <AnimatedContent
                    key={idx}
                    distance={10}
                    duration={0.28}
                    threshold={0}
                    className="flex justify-end"
                  >
                    <div className="max-w-[85%] whitespace-pre-wrap break-words rounded-2xl border border-black/10 bg-gray-100 px-3 py-2 text-sm leading-6 text-gray-950">
                      {msg.content}
                    </div>
                  </AnimatedContent>
                );
              }

              return (
                <AnimatedContent
                  key={idx}
                  distance={10}
                  duration={0.28}
                  threshold={0}
                  className="w-full py-1"
                >
                  <AssistantMarkdown content={msg.content} />
                </AnimatedContent>
              );
            })}
            {streamingText && (
              <div className="w-full py-1">
                <AssistantMarkdown content={streamingText} streaming />
              </div>
            )}
            {isBusy && !streamingText && agentStatus && (
              <AgentStatusIndicator
                status={agentStatus}
                thinkingText={agentTr.thinking}
                workingText={agentTr.working}
              />
            )}
          </>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input area */}
      <div className="border-t border-black/10 bg-white p-3 shrink-0 space-y-2">
        {error && (
          <div className="flex items-start gap-2 rounded-lg bg-destructive/10 px-3 py-2 text-xs text-destructive">
            <AlertCircle className="size-3.5 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}
        {pendingClarification ? (
          <SpotlightCard
            className="rounded-md border border-black/12 bg-[#fbfbfa] p-3"
            spotlightColor="rgba(0, 0, 0, 0.045)"
          >
            <div className="mb-3 flex items-start gap-2">
              <AgentAvatar size="sm" active />
              <div className="min-w-0">
                <div className="text-xs font-semibold uppercase tracking-[0.12em] text-gray-500">
                  {agentTr.clarificationDialogTitle}
                </div>
                <p className="mt-1 text-sm font-medium leading-6 text-gray-950">
                  {pendingClarification.request.question}
                </p>
                {pendingClarification.request.reason && (
                  <p className="mt-1 text-xs leading-5 text-muted-foreground">
                    {pendingClarification.request.reason}
                  </p>
                )}
              </div>
            </div>

            {pendingClarification.request.choices && pendingClarification.request.choices.length > 0 && (
              <div className="mb-3 flex flex-wrap gap-1.5">
                {pendingClarification.request.choices.map((choice) => (
                  <button
                    key={choice}
                    type="button"
                    onClick={() => setClarificationAnswer(choice)}
                    className={`rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
                      clarificationAnswer === choice
                        ? "border-black bg-black text-white"
                        : "border-black/10 bg-white text-gray-800 hover:border-black/30 hover:bg-gray-50"
                    }`}
                  >
                    {choice}
                  </button>
                ))}
              </div>
            )}

            <div className="flex gap-2">
              <Input
                value={clarificationAnswer}
                onChange={(e) => setClarificationAnswer(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleContinueClarification();
                  }
                }}
                placeholder={agentTr.clarificationPlaceholder}
                disabled={isLoading}
                className="editor-dialog-input h-9 flex-1"
                autoFocus
              />
              <Button
                variant="outline"
                className="editor-dialog-cancel h-9 cursor-pointer"
                onClick={handleCancelClarification}
                disabled={isLoading}
              >
                {agentTr.cancelTask}
              </Button>
              <Button
                variant="outline"
                className="editor-dialog-action h-9 cursor-pointer"
                onClick={handleContinueClarification}
                disabled={isLoading || !clarificationAnswer.trim()}
              >
                {isLoading ? <Loader2 className="size-3.5 animate-spin" /> : agentTr.continueTask}
              </Button>
            </div>
          </SpotlightCard>
        ) : (
          <div className="flex gap-2">
            <textarea
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
              placeholder={isConfigured ? agentTr.inputPlaceholder : agentTr.disabledPlaceholder}
              disabled={isChatDisabled}
              className="flex-1 min-h-10 max-h-24 resize-none rounded-md border border-gray-300 bg-white px-3 py-2 text-sm placeholder:text-gray-400 disabled:opacity-50 focus:border-gray-600 focus:outline-none"
            />
            <Button
              size="icon-sm"
              onClick={isLoading ? handleCancelRunningTask : handleSend}
              disabled={isLoading ? false : isChatDisabled || !inputValue.trim()}
              className="shrink-0 self-end rounded-full bg-black text-white hover:bg-gray-800 disabled:bg-gray-300 disabled:text-gray-600"
              title={isLoading ? agentTr.cancelRunningTaskTitle : undefined}
            >
              {isLoading ? (
                <Square className="size-3.5 fill-current" />
              ) : (
                <Send className="size-4" />
              )}
            </Button>
          </div>
        )}
      </div>

      {/* Context Dialog */}
      <Dialog
        open={contextOpen}
        onOpenChange={(open) => {
          setContextOpen(open);
          if (!open) setContextError(null);
        }}
      >
        <DialogContent className="editor-dialog overflow-hidden p-0 sm:max-w-[460px]">
          <DialogHeader className="editor-dialog-header place-items-start px-5 pb-4 pt-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-black/40 bg-black/[0.035]">
                <Paperclip className="h-4 w-4 text-foreground" />
              </div>
              <DialogTitle className="text-[15px] font-semibold">
                {agentTr.contextTitle}
              </DialogTitle>
            </div>
          </DialogHeader>

          <div className="grid gap-4 px-5 pb-5 pt-3">
            {contextError && (
              <div className="flex items-start gap-2 rounded-lg bg-destructive/10 px-3 py-2 text-xs text-destructive">
                <AlertCircle className="size-3.5 shrink-0 mt-0.5" />
                <span>{contextError}</span>
              </div>
            )}

            <div className="rounded-md border border-black/10 bg-white p-3">
              <div className="mb-2 flex items-center gap-2 text-sm font-medium text-gray-950">
                <Upload className="size-4" />
                {agentTr.contextUploadTitle}
              </div>
              <p className="mb-3 text-xs leading-5 text-muted-foreground">
                {agentTr.contextUploadHint}
              </p>
              <label
                className={`editor-dialog-upload-button flex h-10 items-center justify-center rounded-md border px-3 text-sm font-medium ${
                  contextSources.filter((source) => source.type === "file").length >= CONTEXT_MAX_FILE_SOURCES
                    ? "pointer-events-none opacity-50"
                    : "cursor-pointer"
                }`}
              >
                Click here to upload files
                <input
                  type="file"
                  multiple
                  accept=".txt,.md,.markdown,.json,.csv,.tsv,.xml,.html,.htm,.log,.yaml,.yml,text/*,application/json,application/xml"
                  onChange={handleFileContextUpload}
                  className="sr-only"
                  disabled={contextSources.filter((source) => source.type === "file").length >= CONTEXT_MAX_FILE_SOURCES}
                />
              </label>
            </div>

            <div className="rounded-md border border-black/10 bg-white p-3">
              <div className="mb-2 flex items-center gap-2 text-sm font-medium text-gray-950">
                <LinkIcon className="size-4" />
                {agentTr.contextLinkedInTitle}
              </div>
              <p className="mb-3 text-xs leading-5 text-muted-foreground">
                {agentTr.contextLinkedInHint}
              </p>
              <div className="flex gap-2">
                <Input
                  value={linkedinUrl}
                  onChange={(event) => setLinkedinUrl(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") {
                      event.preventDefault();
                      handleAddLinkedInContext();
                    }
                  }}
                  placeholder="https://www.linkedin.com/in/username"
                  className="editor-dialog-input h-10 flex-1"
                />
                <Button
                  variant="outline"
                  className="editor-dialog-action h-10 cursor-pointer"
                  onClick={handleAddLinkedInContext}
                  disabled={!linkedinUrl.trim() || isAddingLink}
                >
                  {isAddingLink ? <Loader2 className="size-3.5 animate-spin" /> : agentTr.contextAdd}
                </Button>
              </div>
            </div>

            <div className="grid gap-2">
              <div className="text-xs font-semibold uppercase tracking-[0.12em] text-gray-500">
                {agentTr.contextSourcesTitle}
              </div>
              {contextSources.length === 0 ? (
                <div className="rounded-md border border-dashed border-black/12 bg-[#fbfbfa] px-3 py-3 text-xs text-muted-foreground">
                  {agentTr.contextEmpty}
                </div>
              ) : (
                <div className="grid gap-2">
                  {contextSources.map((source) => (
                    <div
                      key={source.id}
                      className="flex items-center gap-2 rounded-md border border-black/10 bg-[#fbfbfa] px-3 py-2"
                    >
                      {source.type === "linkedin" ? <LinkIcon className="size-4 shrink-0 text-gray-600" /> : <FilePenLine className="size-4 shrink-0 text-gray-600" />}
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-sm font-medium text-gray-950">{source.name}</div>
                        <div className="truncate text-xs text-muted-foreground">
                          {source.type === "linkedin" ? source.url : agentTr.contextSourceChars(source.text.length)}
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon-xs"
                        className="h-7 w-7 shrink-0 text-muted-foreground hover:text-foreground"
                        onClick={() => setContextSources((prev) => prev.filter((item) => item.id !== source.id))}
                        title={agentTr.contextRemove}
                      >
                        <Trash2 className="size-3.5" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <DialogFooter className="editor-dialog-footer">
            <Button
              variant="outline"
              className="editor-dialog-action cursor-pointer"
              onClick={() => setContextOpen(false)}
            >
              {agentTr.contextDone}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Config Dialog */}
      <Dialog
        open={configOpen}
        onOpenChange={(open) => {
          setConfigOpen(open);
          if (!open) setConfigError(null);
        }}
      >
        <DialogContent className="editor-dialog overflow-hidden p-0 sm:max-w-[420px]">
          <DialogHeader className="editor-dialog-header place-items-start px-5 pb-4 pt-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-black/40 bg-black/[0.035]">
                <Settings className="h-4 w-4 text-foreground" />
              </div>
              <DialogTitle className="text-[15px] font-semibold">
                {agentTr.configDialogTitle}
              </DialogTitle>
            </div>
          </DialogHeader>

          <div className="grid gap-4 px-5 pb-5 pt-3">
            {configError && (
              <div className="flex items-start gap-2 rounded-lg bg-destructive/10 px-3 py-2 text-xs text-destructive">
                <AlertCircle className="size-3.5 shrink-0 mt-0.5" />
                <span>{configError}</span>
              </div>
            )}
            <div className="grid gap-2">
              <Label htmlFor="base-url" className="text-sm font-medium">
                {agentTr.baseUrl}
              </Label>
              <Input
                id="base-url"
                value={draftConfig.baseURL}
                onChange={(e) =>
                  setDraftConfig((prev) => ({
                    ...prev,
                    baseURL: e.target.value,
                  }))
                }
                placeholder={agentTr.baseUrlPlaceholder}
                className="editor-dialog-input h-10"
                autoFocus
              />
              <p className="text-xs text-muted-foreground">
                {agentTr.baseUrlHelp}
              </p>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="api-key" className="text-sm font-medium">
                {agentTr.apiKey}
              </Label>
              <Input
                id="api-key"
                type="password"
                value={draftConfig.apiKey}
                onChange={(e) =>
                  setDraftConfig((prev) => ({
                    ...prev,
                    apiKey: e.target.value,
                  }))
                }
                placeholder={agentTr.apiKeyPlaceholder}
                className="editor-dialog-input h-10"
              />
              <p className="text-xs text-muted-foreground">
                {agentTr.apiKeyHelp}
              </p>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="model" className="text-sm font-medium">
                {agentTr.modelName}
              </Label>
              <Input
                id="model"
                value={draftConfig.model}
                onChange={(e) =>
                  setDraftConfig((prev) => ({
                    ...prev,
                    model: e.target.value,
                  }))
                }
                placeholder={agentTr.modelPlaceholder}
                className="editor-dialog-input h-10"
              />
              <p className="text-xs text-muted-foreground">
                {agentTr.modelHelp}
              </p>
            </div>
          </div>

          <DialogFooter className="editor-dialog-footer">
            <Button
              variant="outline"
              className="editor-dialog-cancel cursor-pointer"
              onClick={() => setConfigOpen(false)}
            >
              {tr.cancel}
            </Button>
            <Button
              variant="outline"
              className="editor-dialog-action cursor-pointer"
              onClick={handleConfigSave}
              disabled={isSavingConfig}
            >
              {isSavingConfig ? agentTr.saving : tr.save}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
