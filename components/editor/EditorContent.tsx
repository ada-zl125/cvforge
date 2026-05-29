"use client";

import { useState } from "react";
import type { ResumeContent, ResumeTemplate, ResumeLanguage } from "@/lib/types/resume";
import { defaultResumeContent, RESUME_STORAGE_KEY } from "@/lib/defaults";
import { useEditorState } from "@/lib/editor-state";
import { EditorFrame } from "@/components/shared/EditorFrame";
import { Toolbar } from "./Toolbar";
import { FormPanel } from "./FormPanel";
import { PreviewPanel } from "./PreviewPanel";
import { ChatPanel, createInitialAgentPanelState } from "@/components/shared/ChatPanel";
import { isLLMConfigComplete } from "@/lib/agent/config";
import { stripResumeLegacyContacts } from "@/lib/json-utils";
import { contentSignature, type AgentChange } from "@/lib/agent/change-tracking";

interface EditorState {
  title: string;
  template: ResumeTemplate;
  language: ResumeLanguage;
  content: ResumeContent;
}

const initialState: EditorState = {
  title: "My Resume",
  template: "general",
  language: "en",
  content: defaultResumeContent,
};

export function EditorContent() {
  const [isAgentMode, setIsAgentMode] = useState(false);
  const [isAgentRunning, setIsAgentRunning] = useState(false);
  const [agentState, setAgentState] = useState(createInitialAgentPanelState);
  const [reviewChange, setReviewChange] = useState<AgentChange | null>(null);

  const { state, setContent, setStoredState } = useEditorState<
    ResumeContent,
    ResumeTemplate,
    ResumeLanguage
  >({
    storageKey: RESUME_STORAGE_KEY,
    initialState,
    defaultContent: defaultResumeContent,
  });

  function handleSettingsChange(newTitle: string, newLanguage: ResumeLanguage, newTemplate: ResumeTemplate) {
    setStoredState({
      title: newTitle,
      template: newTemplate,
      language: newLanguage,
      content,
    });
  }

  if (!state.hydrated) return null;

  const content = stripResumeLegacyContacts(state.content);
  const setResumeContent = (nextContent: ResumeContent) => {
    const normalized = stripResumeLegacyContacts(nextContent);
    if (reviewChange && contentSignature(normalized) !== reviewChange.afterSignature) {
      setReviewChange(null);
    }
    setContent(normalized);
  };

  return (
    <EditorFrame
      toolbar={
        <Toolbar
          title={state.title}
          template={state.template}
          language={state.language}
          content={content}
          isAgentMode={isAgentMode}
          onSettingsChange={handleSettingsChange}
          onImport={setStoredState}
          onModeToggle={() => setIsAgentMode((v) => !v)}
        />
      }
      form={
        isAgentMode
          ? (
            <ChatPanel
              docType="resume"
              documentLanguage={state.language}
              content={content}
              onChange={setResumeContent}
              onReviewChange={setReviewChange}
              onAgentRunningChange={setIsAgentRunning}
              agentState={agentState}
              onAgentStateChange={setAgentState}
            />
          )
          : <FormPanel content={content} onChange={setResumeContent} language={state.language} />
      }
      preview={<PreviewPanel content={content} language={state.language} reviewChange={reviewChange} isStreaming={isAgentRunning} />}
      isAgentMode={isAgentMode}
      isLLMConfigured={isLLMConfigComplete(agentState.activeConfig)}
    />
  );
}
