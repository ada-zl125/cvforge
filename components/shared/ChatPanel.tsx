"use client";

import { useEffect, useLayoutEffect, useRef, useState, type Dispatch, type SetStateAction } from "react";
import { Send, SlidersHorizontal, Loader2, AlertCircle, Settings, Eraser, Shrink, FilePenLine, Square, Paperclip, Trash2, Upload, Eye, BrainCircuit } from "lucide-react";
import { Button } from "@/components/ui/button";
import FadeContent from "@/components/FadeContent";
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
  discardAgentResume,
  estimateAgentContextUsage,
  resumeAgentStream,
  runAgentStream,
  type AgentStatus,
  type Message,
} from "@/lib/agent/chat";
import {
  isLLMConfigComplete,
  readLLMConfig,
  type LLMConfig,
  writeLLMConfig,
} from "@/lib/agent/config";
import { validateLLMConfig } from "@/lib/agent/model";
import { resolveLLMProvider } from "@/lib/agent/providers";
import type { ClarificationRequest, DocType, DocumentLanguage } from "@/lib/agent/tools";
import { buildAgentChange, contentSignature, type AgentChange } from "@/lib/agent/change-tracking";
import {
  CONTEXT_DOCUMENT_ACCEPT,
  CONTEXT_MAX_FILE_BYTES,
  CONTEXT_MAX_FILE_SOURCES,
  extractContextSourceText,
  isSupportedDocumentFile,
  type AgentContextSource,
} from "@/lib/agent/context-sources";
import type { AgentPanelState, PendingClarification } from "@/lib/agent/session-state";
import {
  AgentAvatar,
  AgentEmptyState,
  AgentStatusIndicator,
  AssistantMarkdown,
  AssistantMessageBubble,
  ChangeCard,
  ContextSummaryMessage,
  ContextUsageIndicator,
  UserMessageBubble,
} from "@/components/shared/agent-panel/AgentPanelUi";
import { useUILanguage } from "@/lib/ui-language";
import { t } from "@/lib/translations";

const MAX_CLARIFICATION_ROUNDS = 2;
const INPUT_MAX_VISIBLE_ROWS = 6;
type AgentTranslations = typeof t.en.agent | typeof t.zh.agent;

function getContextReadErrorMessage(
  fileName: string,
  error: unknown,
  agentTr: AgentTranslations
): string {
  const errorName = error instanceof Error ? error.name : "";
  const errorMessage = error instanceof Error ? error.message : "";
  const details = `${errorName} ${errorMessage}`.toLowerCase();

  if (/password/.test(details)) return agentTr.contextPasswordProtected(fileName);
  if (/invalidpdf|invalid pdf|corrupt|damaged/.test(details)) return agentTr.contextInvalidPdf(fileName);
  if (/worker|module/.test(details) && fileName.toLowerCase().endsWith(".pdf")) {
    return agentTr.contextPdfWorkerFailed(fileName);
  }

  return agentTr.contextReadFailed(fileName);
}

function getContextReadErrorDetails(error: unknown): Record<string, unknown> {
  if (error instanceof Error) {
    return {
      name: error.name,
      message: error.message,
      stack: error.stack,
    };
  }

  return { value: error };
}

function formatContextReadErrorDetails(error: unknown): string {
  const details = getContextReadErrorDetails(error);
  try {
    return JSON.stringify(details);
  } catch {
    return String(error);
  }
}

interface ChatPanelProps<TContent> {
  docType: DocType;
  documentLanguage: DocumentLanguage;
  content: TContent;
  onChange: (content: TContent) => void;
  onReviewChange?: (change: AgentChange | null) => void;
  onAgentRunningChange?: (running: boolean) => void;
  agentState: AgentPanelState;
  onAgentStateChange: Dispatch<SetStateAction<AgentPanelState>>;
}

function localizeClarificationReason(reason: string | undefined, lang: "en" | "zh", agentTr: AgentTranslations): string {
  if (!reason) return "";
  if (lang !== "zh") return reason;

  const normalized = reason.trim();
  if (normalized === t.en.agent.clarificationReasonStructuredUpdate) {
    return agentTr.clarificationReasonStructuredUpdate;
  }
  if (normalized === t.en.agent.clarificationReasonAmbiguous) {
    return agentTr.clarificationReasonAmbiguous;
  }

  return reason;
}

function formatClarificationMessage(request: ClarificationRequest, lang: "en" | "zh", agentTr: AgentTranslations): string {
  const scope = request.field || request.section;
  const localizedReason = localizeClarificationReason(request.reason, lang, agentTr);
  if (lang === "zh") {
    const reason = localizedReason ? `${agentTr.clarificationReasonLabel}: ${localizedReason}` : "";
    const target = scope ? `\n\n${agentTr.clarificationRelatedFieldLabel}: ${scope}` : "";
    return `${agentTr.clarificationMessageIntro}: ${request.question}\n\n${reason}${target}`.trim();
  }

  const reason = localizedReason ? `${agentTr.clarificationReasonLabel}: ${localizedReason}` : "";
  const target = scope ? `\n\n${agentTr.clarificationRelatedFieldLabel}: ${scope}` : "";
  return `${agentTr.clarificationMessageIntro}: ${request.question}\n\n${reason}${target}`.trim();
}

function isDocumentEditIntent(text: string): boolean {
  return /\b(add|update|set|change|fill|insert|write|rewrite|polish|improve|optimi[sz]e|refine|edit|revise|replace)\b/i.test(text) ||
    /添加|更新|修改|填写|填入|写入|润色|优化|改写|编辑|替换|补充/.test(text);
}

function shouldReplaceWithNoChangeNotice(params: {
  before: unknown;
  after: unknown;
  toolNames: string[];
  userMessage: string;
  streamedText: string;
  forceEditIntent?: boolean;
}) {
  if (params.toolNames.length > 0) return false;
  if (!params.streamedText.trim()) return false;
  if (contentSignature(params.before) !== contentSignature(params.after)) return false;
  return params.forceEditIntent || isDocumentEditIntent(params.userMessage);
}

export function ChatPanel<TContent>({
  docType,
  documentLanguage,
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

  const {
    messages,
    activeConfig,
    draftConfig,
    pendingClarification,
    lastChange,
    contextSources = [],
    contextInstruction = "",
  } = agentState;
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
  const [contextError, setContextError] = useState<string | null>(null);
  const [isProcessingContext, setIsProcessingContext] = useState(false);
  const [previewContextSource, setPreviewContextSource] = useState<AgentContextSource | null>(null);

  const [configError, setConfigError] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputTextareaRef = useRef<HTMLTextAreaElement>(null);
  const messagesRef = useRef(messages);
  const contentRef = useRef(content);
  const streamingTextRef = useRef("");
  const reasoningTextRef = useRef("");
  const abortControllerRef = useRef<AbortController | null>(null);
  const pendingResumeTokenRef = useRef(pendingClarification?.resumeToken);

  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);

  useEffect(() => {
    contentRef.current = content;
  }, [content]);

  useEffect(() => {
    pendingResumeTokenRef.current = pendingClarification?.resumeToken;
  }, [pendingClarification?.resumeToken]);

  useEffect(() => {
    return () => {
      abortControllerRef.current?.abort();
      discardAgentResume(pendingResumeTokenRef.current);
      onAgentRunningChange?.(false);
    };
  }, [onAgentRunningChange]);

  useEffect(() => {
    onAgentRunningChange?.(isLoading);
  }, [isLoading, onAgentRunningChange]);

  useLayoutEffect(() => {
    const textarea = inputTextareaRef.current;
    if (!textarea) return;

    const styles = window.getComputedStyle(textarea);
    const lineHeight = Number.parseFloat(styles.lineHeight) || 20;
    const paddingTop = Number.parseFloat(styles.paddingTop) || 0;
    const paddingBottom = Number.parseFloat(styles.paddingBottom) || 0;
    const borderTop = Number.parseFloat(styles.borderTopWidth) || 0;
    const borderBottom = Number.parseFloat(styles.borderBottomWidth) || 0;
    const maxHeight = lineHeight * INPUT_MAX_VISIBLE_ROWS + paddingTop + paddingBottom + borderTop + borderBottom;

    textarea.style.height = "auto";
    textarea.style.height = `${Math.min(textarea.scrollHeight, maxHeight)}px`;
    textarea.style.overflowY = textarea.scrollHeight > maxHeight ? "auto" : "hidden";
  }, [inputValue]);

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

  const setContextInstruction = (instruction: string) => {
    onAgentStateChange((prev) => ({
      ...prev,
      contextInstruction: instruction,
    }));
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
        documentLanguage,
        content,
        history: messages,
        referenceSources: contextSources,
        contextInstruction,
      })
    : null;
  const providerProfile = activeConfig
    ? resolveLLMProvider(activeConfig)
    : null;
  const thinkingEnabled =
    providerProfile?.thinkingControl === "always" ||
    (providerProfile?.thinkingControl === "toggle" &&
      !!activeConfig?.thinkingEnabled);
  const thinkingButtonTitle =
    providerProfile?.thinkingControl === "always"
      ? agentTr.thinkingAlwaysOn
      : !providerProfile || providerProfile.thinkingControl === "unavailable"
        ? agentTr.thinkingUnavailable
        : thinkingEnabled
          ? agentTr.disableThinking
          : agentTr.enableThinking;
  const canUndoLastChange =
    !!lastChange && contentSignature(content) === lastChange.afterSignature;
  const agentDocLabel =
    docType === "cover-letter"
      ? agentTr.coverLetter
      : docType === "academic-cv"
        ? agentTr.academicCv
        : agentTr.resume;
  const pendingClarificationReason = pendingClarification
    ? localizeClarificationReason(pendingClarification.request.reason, lang, agentTr)
    : "";
  const promptSuggestions =
    lang === "zh"
      ? [
          "帮我润色项目经历",
          "让表达清晰简洁",
          "检查是否有需要优化的地方",
        ]
      : [
          "Polish my project bullets",
          "Make the tone clear and concise",
          "Check if anything needs improvement",
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

    discardAgentResume(pendingClarification?.resumeToken);
    setMessages([]);
    setStreamingText("");
    streamingTextRef.current = "";
    reasoningTextRef.current = "";
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
        documentLanguage,
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
      reasoningTextRef.current = "";
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
      reasoningTextRef.current = "";

      await runAgentStream({
        config: activeConfig,
        docType,
        documentLanguage,
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
        contextInstruction,
        signal: abortController.signal,
        onTextChunk: (chunk) => {
          setAgentStatus(null);
          streamingTextRef.current += chunk;
          setStreamingText((prev) => prev + chunk);
        },
        onReasoning: (reasoning) => {
          if (thinkingEnabled) reasoningTextRef.current = reasoning;
        },
        onStatusChange: setAgentStatus,
        onClarification: (request, resumeToken) => {
          setPendingClarification({
            id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
            resumeToken,
            originalUserMessage: userMsg,
            request,
            history: nextMessages,
            documentState: contentRef.current,
            clarificationCount: 1,
          });
        },
        onDone: () => {
          const finalText = shouldReplaceWithNoChangeNotice({
            before: beforeContent,
            after: latestContent,
            toolNames: changedToolNames,
            userMessage: userMsg,
            streamedText: streamingTextRef.current,
          })
            ? agentTr.noDocumentChangeNotice
            : streamingTextRef.current;
          if (finalText) {
            setMessages((prev) => [
              ...prev,
              {
                role: "assistant",
                content: finalText,
                reasoning: reasoningTextRef.current || undefined,
              },
            ]);
          }
          setAgentStatus(null);
          streamingTextRef.current = "";
          reasoningTextRef.current = "";
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
        reasoningTextRef.current = "";
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
      reasoningTextRef.current = "";
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
      "Resume the interrupted task using this clarification.",
      `Original task: ${pending.originalUserMessage}`,
      `Question: ${pending.request.question}`,
      `Answer: ${answer}`,
      pending.request.section ? `Clarification section scope: ${pending.request.section}` : null,
      pending.request.field ? `Clarification field scope: ${pending.request.field}` : null,
      `Clarification round: ${pending.clarificationCount}`,
      "Apply the answer only within the original scope, then continue with the tools when the blocker is resolved.",
      canAskAnotherClarification
        ? "Ask one more focused question only if another necessary blocker remains. Otherwise complete the safest accurate result."
        : "Do not ask another clarification. Complete the safest accurate result with supported information.",
    ].filter(Boolean).join("\n");
    const visibleAnswer =
      lang === "zh"
        ? `补充确认: ${answer}`
        : `Clarification: ${answer}`;
    const historyWithQuestion: Message[] = [
      ...pending.history,
      {
        role: "assistant",
        content: formatClarificationMessage(pending.request, lang, agentTr),
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
    reasoningTextRef.current = "";
    const abortController = new AbortController();
    abortControllerRef.current = abortController;
    const beforeContent = contentRef.current;
    let latestContent = beforeContent;
    const changedToolNames: string[] = [];

    const continuationCallbacks = {
      onContentUpdate: (updated, toolName) => {
        contentRef.current = updated;
        latestContent = updated;
        changedToolNames.push(toolName);
        onChange(updated);
      },
      signal: abortController.signal,
      onTextChunk: (chunk) => {
        setAgentStatus(null);
        streamingTextRef.current += chunk;
        setStreamingText((prev) => prev + chunk);
      },
      onReasoning: (reasoning) => {
        if (thinkingEnabled) reasoningTextRef.current = reasoning;
      },
      onStatusChange: setAgentStatus,
      onClarification: (request, resumeToken) => {
        setPendingClarification({
          id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
          resumeToken,
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
        const finalText = shouldReplaceWithNoChangeNotice({
          before: beforeContent,
          after: latestContent,
          toolNames: changedToolNames,
          userMessage: continuationMessage,
          streamedText: streamingTextRef.current,
          forceEditIntent: true,
        })
          ? agentTr.noDocumentChangeNotice
          : streamingTextRef.current;
        if (finalText) {
          setMessages((prev) => [
            ...prev,
            {
              role: "assistant",
              content: finalText,
              reasoning: reasoningTextRef.current || undefined,
            },
          ]);
        }
        setAgentStatus(null);
        streamingTextRef.current = "";
        reasoningTextRef.current = "";
        setStreamingText("");
        recordAgentChange(beforeContent, latestContent, changedToolNames);
      },
    } satisfies Pick<
      Parameters<typeof runAgentStream<TContent>>[0],
      | "onContentUpdate"
      | "signal"
      | "onTextChunk"
      | "onReasoning"
      | "onStatusChange"
      | "onClarification"
      | "onDone"
    >;

    try {
      const resumed = pending.resumeToken
        ? await resumeAgentStream({
            ...continuationCallbacks,
            resumeToken: pending.resumeToken,
            answer,
            currentContent: contentRef.current,
          })
        : false;

      if (!resumed) {
        await runAgentStream({
          ...continuationCallbacks,
          config: activeConfig,
          docType,
          documentLanguage,
          getContent: () => contentRef.current,
          history: historyWithQuestion,
          userMessage: continuationMessage,
          referenceSources: contextSources,
          contextInstruction,
          initialClarificationCount: pending.clarificationCount,
        });
      }
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
        reasoningTextRef.current = "";
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
      reasoningTextRef.current = "";
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

    discardAgentResume(pendingClarification.resumeToken);
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

    setIsProcessingContext(true);
    setContextError(null);

    const nextSources: AgentContextSource[] = [];
    const existingFileKeys = new Set(
      contextSources.map((source) => `${source.name}:${source.size ?? 0}`)
    );
    const nextFileKeys = new Set<string>();

    try {
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
        const fileKey = `${file.name}:${file.size}`;
        if (existingFileKeys.has(fileKey) || nextFileKeys.has(fileKey)) {
          setContextError(agentTr.contextDuplicateFile(file.name));
          continue;
        }

        if (!isSupportedDocumentFile(file)) {
          setContextError(agentTr.contextUnsupportedFile(file.name));
          continue;
        }

        if (file.size > CONTEXT_MAX_FILE_BYTES) {
          setContextError(agentTr.contextFileTooLarge(file.name));
          continue;
        }

        try {
          const text = await extractContextSourceText(file);
          if (!text) {
            const lowerName = file.name.toLowerCase();
            setContextError(lowerName.endsWith(".pdf")
              ? agentTr.contextNoExtractedText(file.name)
              : agentTr.contextEmptyFile(file.name));
            continue;
          }

          nextFileKeys.add(fileKey);
          nextSources.push({
            id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
            type: "file",
            name: file.name,
            text,
            size: file.size,
            createdAt: Date.now(),
          });
        } catch (err) {
          console.warn(
            `Failed to read context source "${file.name}": ${formatContextReadErrorDetails(err)}`
          );
          setContextError(getContextReadErrorMessage(file.name, err, agentTr));
        }
      }

      if (nextSources.length > 0) {
        setContextSources((prev) => [...prev, ...nextSources].slice(-8));
      }
    } finally {
      setIsProcessingContext(false);
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
      const candidateConfig: LLMConfig = {
        baseURL: draftConfig.baseURL.trim().replace(/\/+$/, ""),
        apiKey: draftConfig.apiKey.trim(),
        model: draftConfig.model.trim(),
        thinkingEnabled: draftConfig.thinkingEnabled,
      };
      const nextConfig: LLMConfig = {
        ...candidateConfig,
        thinkingEnabled:
          resolveLLMProvider(candidateConfig).thinkingControl === "toggle" &&
          candidateConfig.thinkingEnabled,
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

  const handleThinkingToggle = () => {
    if (
      !activeConfig ||
      providerProfile?.thinkingControl !== "toggle" ||
      isBusy ||
      hasPendingClarification
    ) {
      return;
    }

    const nextConfig: LLMConfig = {
      ...activeConfig,
      thinkingEnabled: !thinkingEnabled,
    };
    writeLLMConfig(nextConfig);
    onAgentStateChange((prev) => ({
      ...prev,
      activeConfig: nextConfig,
      draftConfig: {
        ...prev.draftConfig,
        thinkingEnabled: nextConfig.thinkingEnabled,
      },
    }));
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
              <h2 className="text-sm font-semibold leading-5 text-gray-950">
                {agentTr.agentMode}
              </h2>
              {activeConfig && providerProfile && (
                <p
                  className="max-w-40 truncate text-[10px] leading-4 text-muted-foreground"
                  title={`${providerProfile.label} · ${activeConfig.model}`}
                >
                  {providerProfile.label} · {activeConfig.model}
                </p>
              )}
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
            onClick={handleThinkingToggle}
            disabled={
              !isConfigured ||
              isBusy ||
              hasPendingClarification ||
              providerProfile?.thinkingControl !== "toggle"
            }
            aria-pressed={thinkingEnabled}
            aria-label={thinkingButtonTitle}
            className={`relative hover:text-foreground disabled:pointer-events-none disabled:opacity-35 ${
              thinkingEnabled
                ? "bg-black/[0.07] text-gray-950"
                : "text-muted-foreground"
            }`}
            title={thinkingButtonTitle}
          >
            <BrainCircuit className="size-4" />
            {thinkingEnabled && (
              <span className="absolute right-0.5 top-0.5 size-1.5 rounded-full bg-emerald-500" />
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
                    undoLabel={agentTr.undoChange}
                    undoUnavailableTitle={agentTr.undoChangeUnavailable}
                  />
                );
              }

              if (isUser) {
                return (
                  <UserMessageBubble key={idx} content={msg.content} />
                );
              }

              return (
                <AssistantMessageBubble
                  key={idx}
                  content={msg.content}
                  reasoning={msg.reasoning}
                  reasoningLabel={agentTr.reasoningLabel}
                />
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
                {pendingClarificationReason && (
                  <p className="mt-1 text-xs leading-5 text-muted-foreground">
                    {pendingClarificationReason}
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
              ref={inputTextareaRef}
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
              className="flex-1 min-h-10 resize-none rounded-md border border-gray-300 bg-white px-3 py-2 text-sm placeholder:text-gray-400 disabled:opacity-50 focus:border-gray-600 focus:outline-none"
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
              <div className="flex min-w-0 items-center gap-2">
                <DialogTitle className="text-[15px] font-semibold">
                  {agentTr.contextTitle}
                </DialogTitle>
                <span className="rounded border border-amber-500/35 bg-amber-50 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-[0.08em] text-amber-700">
                  {agentTr.contextBetaBadge}
                </span>
              </div>
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
              <div className="mb-2 text-sm font-medium text-gray-950">
                {agentTr.contextInstructionTitle}
              </div>
              <p className="mb-3 text-xs leading-5 text-muted-foreground">
                {agentTr.contextInstructionHint}
              </p>
              <textarea
                value={contextInstruction}
                onChange={(event) => setContextInstruction(event.target.value)}
                placeholder={agentTr.contextInstructionPlaceholder}
                className="editor-dialog-input min-h-24 w-full resize-y rounded-md border px-3 py-2 text-sm leading-5"
              />
            </div>

            <div className="rounded-md border border-black/10 bg-white p-3">
              <div className="mb-2 flex items-center gap-2 text-sm font-medium text-gray-950">
                <Upload className="size-4" />
                {agentTr.contextUploadTitle}
              </div>
              <p className="mb-3 text-xs leading-5 text-muted-foreground">
                {agentTr.contextUploadHint}
              </p>
              <p className="mb-3 rounded-md border border-amber-500/20 bg-amber-50 px-2.5 py-2 text-xs leading-5 text-amber-800">
                {agentTr.contextBetaNotice}
              </p>
              <label
                className={`editor-dialog-upload-button flex h-10 items-center justify-center rounded-md border px-3 text-sm font-medium ${
                  contextSources.filter((source) => source.type === "file").length >= CONTEXT_MAX_FILE_SOURCES || isProcessingContext
                    ? "pointer-events-none opacity-50"
                    : "cursor-pointer"
                }`}
              >
                {isProcessingContext ? (
                  <span className="flex items-center gap-2">
                    <Loader2 className="size-3.5 animate-spin" />
                    {agentTr.contextProcessing}
                  </span>
                ) : tr.uploadFilesCta}
                <input
                  type="file"
                  multiple
                  accept={CONTEXT_DOCUMENT_ACCEPT}
                  onChange={handleFileContextUpload}
                  className="sr-only"
                  disabled={contextSources.filter((source) => source.type === "file").length >= CONTEXT_MAX_FILE_SOURCES || isProcessingContext}
                />
              </label>
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
                      <FilePenLine className="size-4 shrink-0 text-gray-600" />
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-sm font-medium text-gray-950">{source.name}</div>
                        <div className="truncate text-xs text-muted-foreground">
                          {agentTr.contextSourceChars(source.text.length)}
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon-xs"
                        className="h-7 w-7 shrink-0 text-muted-foreground hover:text-foreground"
                        onClick={() => setPreviewContextSource(source)}
                        title={agentTr.contextPreview}
                      >
                        <Eye className="size-3.5" />
                      </Button>
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

      <Dialog
        open={!!previewContextSource}
        onOpenChange={(open) => {
          if (!open) setPreviewContextSource(null);
        }}
      >
        <DialogContent className="editor-dialog overflow-hidden p-0 sm:max-w-[640px]">
          <DialogHeader className="editor-dialog-header place-items-start px-5 pb-4 pt-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-black/40 bg-black/[0.035]">
                <FilePenLine className="h-4 w-4 text-foreground" />
              </div>
              <div className="min-w-0">
                <DialogTitle className="truncate text-[15px] font-semibold">
                  {agentTr.contextPreviewTitle}
                </DialogTitle>
                {previewContextSource && (
                  <div className="mt-0.5 truncate text-xs text-muted-foreground">
                    {previewContextSource.name}
                  </div>
                )}
              </div>
            </div>
          </DialogHeader>

          <div className="px-5 pb-5 pt-3">
            <pre className="max-h-[420px] overflow-auto whitespace-pre-wrap rounded-md border border-black/10 bg-[#fbfbfa] p-3 text-xs leading-5 text-gray-800">
              {previewContextSource?.text}
            </pre>
            <p className="mt-2 text-xs leading-5 text-muted-foreground">
              {agentTr.contextDeleteHistoryNote}
            </p>
          </div>

          <DialogFooter className="editor-dialog-footer">
            <Button
              variant="outline"
              className="editor-dialog-action cursor-pointer"
              onClick={() => setPreviewContextSource(null)}
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
