"use client";

import { useState } from "react";
import type { CoverLetterContent, CoverLetterTemplate } from "@/lib/types/cover-letter";
import { defaultCoverLetterContent, COVER_LETTER_STORAGE_KEY } from "@/lib/defaults";
import { useEditorState } from "@/lib/editor-state";
import { EditorFrame } from "@/components/shared/EditorFrame";
import { Toolbar } from "./Toolbar";
import { FormPanel } from "./FormPanel";
import { PreviewPanel } from "./PreviewPanel";
import { ChatPanel, createInitialAgentPanelState } from "@/components/shared/ChatPanel";
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
  const [agentState, setAgentState] = useState(createInitialAgentPanelState);
  const [reviewChange, setReviewChange] = useState<AgentChange | null>(null);

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
          onTitleChange={handleTitleChange}
          onImport={setStoredState}
        />
      }
      form={
        isAgentMode
          ? (
            <ChatPanel
              docType="cover-letter"
              content={state.content}
              onChange={setCoverLetterContent}
              onReviewChange={setReviewChange}
              agentState={agentState}
              onAgentStateChange={setAgentState}
            />
          )
          : <FormPanel content={state.content} onChange={setCoverLetterContent} />
      }
      preview={<PreviewPanel content={state.content} reviewChange={reviewChange} />}
      isAgentMode={isAgentMode}
      isLLMConfigured={isLLMConfigComplete(agentState.activeConfig)}
      onModeToggle={() => setIsAgentMode((v) => !v)}
    />
  );
}
