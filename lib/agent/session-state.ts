import type { AgentChange } from "@/lib/agent/change-tracking";
import type { Message } from "@/lib/agent/chat";
import type { LLMConfig } from "@/lib/agent/config";
import type { AgentContextSource } from "@/lib/agent/context-sources";
import type { AgentContextUsage } from "@/lib/agent/context-usage";
import type { ClarificationRequest } from "@/lib/agent/tools";

export interface PendingClarification {
  id: string;
  resumeToken: string;
  request: ClarificationRequest;
}

export interface AgentPanelState {
  messages: Message[];
  activeConfig: LLMConfig | null;
  draftConfig: LLMConfig;
  pendingClarification: PendingClarification | null;
  lastChange: AgentChange | null;
  contextSources: AgentContextSource[];
  contextInstruction: string;
  contextUsage: AgentContextUsage | null;
  contextUsageUnavailable: boolean;
}

type StoredAgentPanelState = Pick<
  AgentPanelState,
  | "messages"
  | "lastChange"
  | "contextSources"
  | "contextInstruction"
  | "contextUsage"
  | "contextUsageUnavailable"
>;

export function createInitialAgentPanelState(): AgentPanelState {
  return {
    messages: [],
    activeConfig: null,
    draftConfig: {
      baseURL: "",
      apiKey: "",
      model: "",
      thinkingEnabled: false,
    },
    pendingClarification: null,
    lastChange: null,
    contextSources: [],
    contextInstruction: "",
    contextUsage: null,
    contextUsageUnavailable: false,
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function readContextSources(value: unknown): AgentContextSource[] {
  if (!Array.isArray(value)) return [];
  return value.filter((source): source is AgentContextSource =>
    isRecord(source) &&
    source.type === "file" &&
    typeof source.id === "string" &&
    typeof source.name === "string" &&
    typeof source.text === "string" &&
    typeof source.createdAt === "number"
  );
}

function readContextUsage(value: unknown): AgentContextUsage | null {
  if (
    !isRecord(value) ||
    typeof value.inputTokens !== "number" ||
    !Number.isFinite(value.inputTokens) ||
    value.inputTokens < 0 ||
    typeof value.model !== "string"
  ) {
    return null;
  }

  const maxInputTokens =
    typeof value.maxInputTokens === "number" &&
    Number.isFinite(value.maxInputTokens) &&
    value.maxInputTokens > 0
      ? value.maxInputTokens
      : undefined;

  return {
    inputTokens: value.inputTokens,
    maxInputTokens,
    model: value.model,
  };
}

export function readAgentPanelSessionState(storageKey: string): AgentPanelState {
  const initialState = createInitialAgentPanelState();
  if (typeof window === "undefined") return initialState;

  try {
    const raw = sessionStorage.getItem(storageKey);
    if (!raw) return initialState;
    const parsed = JSON.parse(raw);
    if (!isRecord(parsed)) return initialState;

    return {
      ...initialState,
      messages: Array.isArray(parsed.messages) ? parsed.messages as Message[] : initialState.messages,
      lastChange: isRecord(parsed.lastChange) ? parsed.lastChange as unknown as AgentChange : null,
      contextSources: readContextSources(parsed.contextSources),
      contextInstruction: typeof parsed.contextInstruction === "string" ? parsed.contextInstruction : "",
      contextUsage: readContextUsage(parsed.contextUsage),
      contextUsageUnavailable: parsed.contextUsageUnavailable === true,
    };
  } catch {
    return initialState;
  }
}

export function writeAgentPanelSessionState(storageKey: string, state: AgentPanelState): void {
  try {
    const storedState: StoredAgentPanelState = {
      messages: state.messages,
      lastChange: state.lastChange,
      contextSources: state.contextSources,
      contextInstruction: state.contextInstruction,
      contextUsage: state.contextUsage,
      contextUsageUnavailable: state.contextUsageUnavailable,
    };
    sessionStorage.setItem(storageKey, JSON.stringify(storedState));
  } catch {
    // Ignore storage quota errors.
  }
}
