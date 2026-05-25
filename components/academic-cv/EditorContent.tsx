"use client";

import { useState } from "react";
import type { AcademicCVContent, AcademicCVTemplate, ResumeLanguage } from "@/lib/types/academic-cv";
import { defaultAcademicCVContent, ACADEMIC_CV_STORAGE_KEY } from "@/lib/defaults";
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
  template: AcademicCVTemplate;
  language: ResumeLanguage;
  content: AcademicCVContent;
}

const initialState: EditorState = {
  title: "My Academic CV",
  template: "academic",
  language: "en",
  content: defaultAcademicCVContent,
};

export function AcademicEditorContent() {
  const [isAgentMode, setIsAgentMode] = useState(false);
  const [isAgentRunning, setIsAgentRunning] = useState(false);
  const [agentState, setAgentState] = useState(createInitialAgentPanelState);
  const [reviewChange, setReviewChange] = useState<AgentChange | null>(null);

  const { state, setContent, setStoredState } = useEditorState<
    AcademicCVContent,
    AcademicCVTemplate,
    ResumeLanguage
  >({
    storageKey: ACADEMIC_CV_STORAGE_KEY,
    initialState,
    defaultContent: defaultAcademicCVContent,
  });

  function handleSettingsChange(newTitle: string, newLanguage: ResumeLanguage, newTemplate: AcademicCVTemplate) {
    setStoredState({
      title: newTitle,
      template: newTemplate,
      language: newLanguage,
      content: state.content,
    });
  }

  if (!state.hydrated) return null;

  const setAcademicContent = (nextContent: AcademicCVContent) => {
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
          template={state.template}
          language={state.language}
          content={state.content}
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
              docType="academic-cv"
              content={state.content}
              onChange={setAcademicContent}
              onReviewChange={setReviewChange}
              onAgentRunningChange={setIsAgentRunning}
              agentState={agentState}
              onAgentStateChange={setAgentState}
            />
          )
          : <FormPanel content={state.content} onChange={setAcademicContent} language={state.language} />
      }
      preview={<PreviewPanel content={state.content} language={state.language} reviewChange={reviewChange} isStreaming={isAgentRunning} />}
      isAgentMode={isAgentMode}
      isLLMConfigured={isLLMConfigComplete(agentState.activeConfig)}
    />
  );
}
