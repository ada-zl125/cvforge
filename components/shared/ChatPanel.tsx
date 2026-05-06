"use client";

import { useEffect, useRef, useState, type Dispatch, type SetStateAction } from "react";
import ReactMarkdown, { type Components } from "react-markdown";
import { Send, SlidersHorizontal, Loader2, AlertCircle, Settings, Eraser, Shrink } from "lucide-react";
import { Button } from "@/components/ui/button";
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
  type LLMConfig,
} from "@/lib/agent/config";
import type { DocType } from "@/lib/agent/tools";
import { useUILanguage } from "@/lib/ui-language";
import { t } from "@/lib/translations";

export interface AgentPanelState {
  messages: Message[];
  activeConfig: LLMConfig | null;
  draftConfig: LLMConfig;
}

export function createInitialAgentPanelState(): AgentPanelState {
  return {
    messages: [],
    activeConfig: null,
    draftConfig: {
      baseURL: "",
      apiKey: "",
      model: "",
    },
  };
}

interface ChatPanelProps<TContent> {
  docType: DocType;
  content: TContent;
  onChange: (content: TContent) => void;
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
};

function AssistantMarkdown({ content, streaming = false }: { content: string; streaming?: boolean }) {
  return (
    <div className="w-full min-w-0 break-words text-sm text-gray-950">
      <ReactMarkdown components={markdownComponents}>{content}</ReactMarkdown>
      {streaming && <span className="animate-pulse">▌</span>}
    </div>
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

function AgentStatusIndicator({
  status,
  thinkingText,
  workingText,
}: {
  status: AgentStatus;
  thinkingText: string;
  workingText: string;
}) {
  const [phase, setPhase] = useState<AgentStatus>(status);

  useEffect(() => {
    setPhase(status);
  }, [status]);

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      setPhase((prev) => (prev === "thinking" ? "working" : "thinking"));
    }, 1800);

    return () => window.clearInterval(intervalId);
  }, []);

  return (
    <div className="flex items-center gap-2.5 py-1 text-xs text-muted-foreground">
      <div className="relative h-5 w-6 shrink-0 animate-[bounce_1.8s_ease-in-out_infinite]" aria-hidden="true">
        <span className="absolute left-0.5 top-1 h-3.5 w-5 rounded-full border border-gray-300 bg-white shadow-sm" />
        <span className="absolute left-1 top-0.5 h-2 w-2 rotate-45 rounded-[2px] border-l border-t border-gray-300 bg-white" />
        <span className="absolute right-1 top-0.5 h-2 w-2 rotate-45 rounded-[2px] border-l border-t border-gray-300 bg-white" />
        <span className="absolute left-[7px] top-[9px] h-1 w-1 rounded-full bg-gray-500" />
        <span className="absolute right-[7px] top-[9px] h-1 w-1 rounded-full bg-gray-500" />
        <span className="absolute left-[11px] top-[11px] h-0.5 w-0.5 rounded-full bg-gray-400" />
        <span className="absolute -right-1.5 top-2 h-2.5 w-2.5 rounded-full border-r border-t border-gray-300" />
      </div>
      <span>{phase === "thinking" ? thinkingText : workingText}</span>
      <span className="flex gap-0.5" aria-hidden="true">
        <span className="h-1 w-1 animate-pulse rounded-full bg-gray-400" />
        <span className="h-1 w-1 animate-pulse rounded-full bg-gray-400 [animation-delay:160ms]" />
        <span className="h-1 w-1 animate-pulse rounded-full bg-gray-400 [animation-delay:320ms]" />
      </span>
    </div>
  );
}

export function ChatPanel<TContent>({
  docType,
  content,
  onChange,
  agentState,
  onAgentStateChange,
}: ChatPanelProps<TContent>) {
  const { lang } = useUILanguage();
  const tr = t[lang];
  const agentTr = tr.agent;

  const { messages, activeConfig, draftConfig } = agentState;
  const [streamingText, setStreamingText] = useState("");
  const [agentStatus, setAgentStatus] = useState<AgentStatus | null>(null);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isCompacting, setIsCompacting] = useState(false);
  const [isSavingConfig, setIsSavingConfig] = useState(false);
  const [configOpen, setConfigOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isHoveringChat, setIsHoveringChat] = useState(false);

  const [configError, setConfigError] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef(content);
  const streamingTextRef = useRef("");

  useEffect(() => {
    contentRef.current = content;
  }, [content]);

  // Reset config when re-entering page (docType change)
  useEffect(() => {
    setConfigError(null);
  }, [docType]);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [agentStatus, messages, streamingText]);

  const setMessages = (updater: SetStateAction<Message[]>) => {
    onAgentStateChange((prev) => ({
      ...prev,
      messages:
        typeof updater === "function"
          ? (updater as (messages: Message[]) => Message[])(prev.messages)
          : updater,
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

  const isConfigured = !!activeConfig;
  const isBusy = isLoading || isCompacting;
  const isChatDisabled = !isConfigured || isBusy;
  const hasChatContext = messages.length > 0 || streamingText !== "";
  const contextUsage = activeConfig
    ? estimateAgentContextUsage({
        model: activeConfig.model,
        docType,
        content,
        history: messages,
      })
    : null;

  const handleClearContext = () => {
    if (isBusy || !hasChatContext) return;

    setMessages([]);
    setStreamingText("");
    streamingTextRef.current = "";
    setAgentStatus(null);
    setError(null);
  };

  const handleCompactContext = async () => {
    if (isBusy || !activeConfig || !isLLMConfigComplete(activeConfig) || messages.length === 0) return;

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

    try {
      // Append user message
      setMessages((prev) => [...prev, { role: "user", content: userMsg }]);
      setStreamingText("");
      streamingTextRef.current = "";

      // Run agent stream
      await runAgentStream({
        config: activeConfig,
        docType,
        getContent: () => contentRef.current,
        onContentUpdate: (updated) => {
          contentRef.current = updated;
          onChange(updated);
        },
        history: messages,
        userMessage: userMsg,
        onTextChunk: (chunk) => {
          setAgentStatus(null);
          streamingTextRef.current += chunk;
          setStreamingText((prev) => prev + chunk);
        },
        onStatusChange: setAgentStatus,
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
        },
      });
    } catch (err) {
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
      setIsLoading(false);
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
    <div className="flex h-full flex-col bg-background">
      {/* Top bar */}
      <div className="flex items-center justify-between border-b border-border bg-card px-4 py-3 shrink-0">
        <h2 className="text-sm font-semibold">{agentTr.agentMode}</h2>
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
            disabled={!isConfigured || isBusy || messages.length === 0}
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
            onClick={() => setConfigOpen(true)}
            className="text-muted-foreground hover:text-foreground"
            title={agentTr.configureTitle}
          >
            <SlidersHorizontal className="size-4" />
          </Button>
        </div>
      </div>

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
          <div className="flex items-start gap-3 text-sm text-muted-foreground">
            <AlertCircle className="size-4 shrink-0 mt-0.5" />
            <div>
              <p className="font-medium mb-1">
                {agentTr.configurePanelTitle}
              </p>
              <p>{agentTr.configureHint}</p>
            </div>
          </div>
        ) : messages.length === 0 && streamingText === "" ? (
          <div className="flex items-center justify-center h-full text-sm text-muted-foreground">
            {agentTr.startConversation(
              docType === "cover-letter"
                ? agentTr.coverLetter
                : docType === "academic-cv"
                  ? agentTr.academicCv
                  : agentTr.resume
            )}
          </div>
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

              if (isUser) {
                return (
                  <div key={idx} className="flex justify-end">
                    <div className="max-w-[85%] whitespace-pre-wrap break-words rounded-2xl border border-gray-200 bg-gray-100 px-3 py-2 text-sm leading-6 text-gray-950">
                      {msg.content}
                    </div>
                  </div>
                );
              }

              return (
                <div key={idx} className="flex justify-start py-1">
                  <AssistantMarkdown content={msg.content} />
                </div>
              );
            })}
            {streamingText && (
              <div className="flex justify-start py-1">
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
      <div className="border-t border-border bg-card p-3 shrink-0 space-y-2">
        {error && (
          <div className="flex items-start gap-2 rounded-lg bg-destructive/10 px-3 py-2 text-xs text-destructive">
            <AlertCircle className="size-3.5 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}
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
            className="flex-1 min-h-10 max-h-24 resize-none rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm placeholder:text-gray-400 disabled:opacity-50 focus:border-gray-600 focus:outline-none"
          />
          <Button
            size="icon-sm"
            onClick={handleSend}
            disabled={isChatDisabled || !inputValue.trim()}
            className="shrink-0 self-end bg-black text-white hover:bg-gray-800 disabled:bg-gray-300 disabled:text-gray-600"
          >
            {isLoading ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Send className="size-4" />
            )}
          </Button>
        </div>
      </div>

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
