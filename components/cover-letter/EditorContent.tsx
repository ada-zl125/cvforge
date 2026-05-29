"use client";

import { useCallback, useState, type SetStateAction } from "react";
import type { CoverLetterContent, CoverLetterTemplate } from "@/lib/types/cover-letter";
import { defaultCoverLetterContent, COVER_LETTER_AGENT_STORAGE_KEY, COVER_LETTER_STORAGE_KEY } from "@/lib/defaults";
import { useEditorState } from "@/lib/editor-state";
import { EditorFrame } from "@/components/shared/EditorFrame";
import { Toolbar } from "./Toolbar";
import { FormPanel } from "./FormPanel";
import { PreviewPanel } from "./PreviewPanel";
import {
  ChatPanel,
  readAgentPanelSessionState,
  writeAgentPanelSessionState,
  type AgentPanelState,
} from "@/components/shared/ChatPanel";
import { isLLMConfigComplete } from "@/lib/agent/config";
import { contentSignature, type AgentChange } from "@/lib/agent/change-tracking";

interface EditorState {
  title: string;
  template: CoverLetterTemplate;
  content: CoverLetterContent;
}

const initialState: EditorState = {
  title: "My Cover Letter",
  template: "classic",
  content: defaultCoverLetterContent,
};

export function CoverLetterEditorContent() {
  const [isAgentMode, setIsAgentMode] = useState(false);
  const [isAgentRunning, setIsAgentRunning] = useState(false);
  const [agentState, setAgentState] = useState(() => readAgentPanelSessionState(COVER_LETTER_AGENT_STORAGE_KEY));
  const [reviewChange, setReviewChange] = useState<AgentChange | null>(null);
  const setPersistedAgentState = useCallback((value: SetStateAction<AgentPanelState>) => {
    setAgentState((prev) => {
      const next = typeof value === "function"
        ? (value as (state: AgentPanelState) => AgentPanelState)(prev)
        : value;
      writeAgentPanelSessionState(COVER_LETTER_AGENT_STORAGE_KEY, next);
      return next;
    });
  }, []);

  const { state, setContent, setStoredState } = useEditorState<
    CoverLetterContent,
    CoverLetterTemplate
  >({
    storageKey: COVER_LETTER_STORAGE_KEY,
    initialState,
    defaultContent: defaultCoverLetterContent,
  });

  function handleTitleChange(newTitle: string) {
    setStoredState({
      title: newTitle,
      template: state.template,
      content: state.content,
    });
  }

  if (!state.hydrated) return null;

  const setCoverLetterContent = (nextContent: CoverLetterContent) => {
    if (reviewChange && contentSignature(nextContent) !== reviewChange.afterSignature) {
      setReviewChange(null);
    }
    setContent(nextContent);
  };

  return (
    <EditorFrame
      toolbar={
        <Toolbar
          title={state.title}
          content={state.content}
          template={state.template}
          isAgentMode={isAgentMode}
          onTitleChange={handleTitleChange}
          onImport={setStoredState}
          onModeToggle={() => setIsAgentMode((v) => !v)}
        />
      }
      form={
        isAgentMode
          ? (
            <ChatPanel
              docType="cover-letter"
              documentLanguage="en"
              content={state.content}
              onChange={setCoverLetterContent}
              onReviewChange={setReviewChange}
              onAgentRunningChange={setIsAgentRunning}
              agentState={agentState}
              onAgentStateChange={setPersistedAgentState}
            />
          )
          : <FormPanel content={state.content} onChange={setCoverLetterContent} />
      }
      preview={<PreviewPanel content={state.content} reviewChange={reviewChange} isStreaming={isAgentRunning} />}
      isAgentMode={isAgentMode}
      isLLMConfigured={isLLMConfigComplete(agentState.activeConfig)}
    />
  );
}
