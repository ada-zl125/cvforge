"use client";

import { useEffect, useRef, useState } from "react";
import { Send, SlidersHorizontal, Loader2, AlertCircle, Settings } from "lucide-react";
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
import { runAgentStream, type Message } from "@/lib/agent/chat";
import {
  isLLMConfigComplete,
  readLLMConfig,
  writeLLMConfig,
  type LLMConfig,
} from "@/lib/agent/config";
import type { DocType } from "@/lib/agent/tools";
import { useUILanguage } from "@/lib/ui-language";
import { t } from "@/lib/translations";

interface ChatPanelProps<TContent> {
  docType: DocType;
  content: TContent;
  onChange: (content: TContent) => void;
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

export function ChatPanel<TContent>({ docType, content, onChange }: ChatPanelProps<TContent>) {
  const { lang } = useUILanguage();
  const tr = t[lang];
  const agentTr = tr.agent;

  const [messages, setMessages] = useState<Message[]>([]);
  const [streamingText, setStreamingText] = useState("");
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [activeConfig, setActiveConfig] = useState<LLMConfig | null>(null);
  const [isCheckingConfig, setIsCheckingConfig] = useState(true);
  const [isSavingConfig, setIsSavingConfig] = useState(false);
  const [configOpen, setConfigOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isHoveringChat, setIsHoveringChat] = useState(false);

  const [draftConfig, setDraftConfig] = useState<LLMConfig>({
    baseURL: "",
    apiKey: "",
    model: "",
  });
  const [configError, setConfigError] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef(content);
  const streamingTextRef = useRef("");

  useEffect(() => {
    contentRef.current = content;
  }, [content]);

  // Load config on mount
  useEffect(() => {
    const config = readLLMConfig();
    if (isLLMConfigComplete(config)) {
      setDraftConfig(config);
      validateLLMConfig(config)
        .then(() => {
          setActiveConfig(config);
          setError(null);
        })
        .catch(() => {
          setActiveConfig(null);
        })
        .finally(() => {
          setIsCheckingConfig(false);
        });
      return;
    }

    if (config) {
      setDraftConfig(config);
    }
    setActiveConfig(null);
    setIsCheckingConfig(false);
  }, []);

  // Reset config when re-entering page (docType change)
  useEffect(() => {
    setConfigError(null);
  }, [docType]);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, streamingText]);

  const isConfigured = !!activeConfig && !isCheckingConfig;
  const isChatDisabled = !isConfigured || isLoading;

  const handleSend = async () => {
    const userMsg = inputValue.trim();
    if (!userMsg || isLoading) return;

    // Re-check configuration validity as extra safety measure
    const currentConfig = readLLMConfig();
    if (!activeConfig || !isLLMConfigComplete(currentConfig)) {
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
          streamingTextRef.current += chunk;
          setStreamingText((prev) => prev + chunk);
        },
        onToolUse: (toolName) => {
          setMessages((prev) => [...prev, { role: "tool", content: "", toolName }]);
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
      writeLLMConfig(nextConfig);
      setDraftConfig(nextConfig);
      setActiveConfig(nextConfig);
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
                {isCheckingConfig ? agentTr.checkingTitle : agentTr.configurePanelTitle}
              </p>
              <p>
                {isCheckingConfig
                  ? agentTr.validatingConfig
                  : agentTr.configureHint}
              </p>
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
              if (msg.role === "tool") {
                return (
                  <div key={idx} className="flex justify-center">
                    <div className="inline-flex items-center gap-1.5 rounded-full bg-muted px-3 py-1.5 text-xs text-muted-foreground">
                      <span>✓ {agentTr.toolUpdated(msg.toolName)}</span>
                    </div>
                  </div>
                );
              }

              const isUser = msg.role === "user";
              return (
                <div
                  key={idx}
                  className={`flex ${isUser ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-xs rounded-lg px-3 py-2 text-sm border ${
                      isUser
                        ? "bg-gray-200 text-gray-900 border-gray-300"
                        : "bg-gray-100 text-gray-900 border-gray-200"
                    }`}
                  >
                    {msg.content}
                  </div>
                </div>
              );
            })}
            {streamingText && (
              <div className="flex justify-start">
                <div className="max-w-xs rounded-lg px-3 py-2 text-sm border bg-gray-100 text-gray-900 border-gray-200">
                  {streamingText}
                  <span className="animate-pulse">▌</span>
                </div>
              </div>
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
