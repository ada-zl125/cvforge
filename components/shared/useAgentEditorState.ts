"use client";

import { useCallback, useState, type SetStateAction } from "react";
import { isLLMConfigComplete } from "@/lib/agent/config";
import {
  readAgentPanelSessionState,
  writeAgentPanelSessionState,
  type AgentPanelState,
} from "@/lib/agent/session-state";

export function useAgentEditorState(agentStorageKey: string) {
  const [isAgentMode, setIsAgentMode] = useState(false);
  const [isAgentRunning, setIsAgentRunning] = useState(false);
  const [agentState, setAgentState] = useState(() => readAgentPanelSessionState(agentStorageKey));

  const setPersistedAgentState = useCallback((value: SetStateAction<AgentPanelState>) => {
    setAgentState((prev) => {
      const next = typeof value === "function"
        ? (value as (state: AgentPanelState) => AgentPanelState)(prev)
        : value;
      writeAgentPanelSessionState(agentStorageKey, next);
      return next;
    });
  }, [agentStorageKey]);

  const toggleAgentMode = useCallback(() => {
    setIsAgentMode((value) => !value);
  }, []);

  return {
    isAgentMode,
    isAgentRunning,
    agentState,
    isLLMConfigured: isLLMConfigComplete(agentState.activeConfig),
    setIsAgentRunning,
    setAgentState: setPersistedAgentState,
    toggleAgentMode,
  };
}
