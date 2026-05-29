import type { AgentChange } from "@/lib/agent/change-tracking";
import type { Message } from "@/lib/agent/chat";
import type { LLMConfig } from "@/lib/agent/config";
import type { AgentContextSource } from "@/lib/agent/context-sources";
import type { ClarificationRequest } from "@/lib/agent/tools";

export interface PendingClarification {
  id: string;
  originalUserMessage: string;
  request: ClarificationRequest;
  history: Message[];
  documentState: unknown;
  clarificationCount: number;
}

export interface AgentPanelState {
  messages: Message[];
  activeConfig: LLMConfig | null;
  draftConfig: LLMConfig;
  pendingClarification: PendingClarification | null;
  lastChange: AgentChange | null;
  contextSources: AgentContextSource[];
}

type StoredAgentPanelState = Pick<
  AgentPanelState,
  "messages" | "pendingClarification" | "lastChange" | "contextSources"
>;

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

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
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
      pendingClarification: isRecord(parsed.pendingClarification) ? parsed.pendingClarification as unknown as PendingClarification : null,
      lastChange: isRecord(parsed.lastChange) ? parsed.lastChange as unknown as AgentChange : null,
      contextSources: Array.isArray(parsed.contextSources) ? parsed.contextSources as AgentContextSource[] : initialState.contextSources,
    };
  } catch {
    return initialState;
  }
}

export function writeAgentPanelSessionState(storageKey: string, state: AgentPanelState): void {
  try {
    const storedState: StoredAgentPanelState = {
      messages: state.messages,
      pendingClarification: state.pendingClarification,
      lastChange: state.lastChange,
      contextSources: state.contextSources,
    };
    sessionStorage.setItem(storageKey, JSON.stringify(storedState));
  } catch {
    // Ignore storage quota errors.
  }
}
