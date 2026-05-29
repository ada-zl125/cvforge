"use client";

import type { AcademicCVContent, AcademicCVTemplate, ResumeLanguage } from "@/lib/types/academic-cv";
import { defaultAcademicCVContent, ACADEMIC_CV_AGENT_STORAGE_KEY, ACADEMIC_CV_STORAGE_KEY } from "@/lib/defaults";
import { useEditorState } from "@/lib/editor-state";
import { EditorFrame } from "@/components/shared/EditorFrame";
import { Toolbar } from "./Toolbar";
import { FormPanel } from "./FormPanel";
import { PreviewPanel } from "./PreviewPanel";
import { ChatPanel } from "@/components/shared/ChatPanel";
import { useAgentEditorState } from "@/components/shared/useAgentEditorState";
import { useReviewableContent } from "@/components/shared/useReviewableContent";

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
  const { state, setContent, setStoredState } = useEditorState<
    AcademicCVContent,
    AcademicCVTemplate,
    ResumeLanguage
  >({
    storageKey: ACADEMIC_CV_STORAGE_KEY,
    initialState,
    defaultContent: defaultAcademicCVContent,
  });
  const {
    isAgentMode,
    isAgentRunning,
    agentState,
    isLLMConfigured,
    setIsAgentRunning,
    setAgentState,
    toggleAgentMode,
  } = useAgentEditorState(ACADEMIC_CV_AGENT_STORAGE_KEY);
  const {
    content,
    reviewChange,
    setContent: setAcademicContent,
    setReviewChange,
  } = useReviewableContent(state.content, setContent);

  function handleSettingsChange(newTitle: string, newLanguage: ResumeLanguage, newTemplate: AcademicCVTemplate) {
    setStoredState({
      title: newTitle,
      template: newTemplate,
      language: newLanguage,
      content: state.content,
    });
  }

  if (!state.hydrated) return null;

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
          onModeToggle={toggleAgentMode}
        />
      }
      form={
        isAgentMode
          ? (
            <ChatPanel
              docType="academic-cv"
              documentLanguage={state.language}
              content={content}
              onChange={setAcademicContent}
              onReviewChange={setReviewChange}
              onAgentRunningChange={setIsAgentRunning}
              agentState={agentState}
              onAgentStateChange={setAgentState}
            />
          )
          : <FormPanel content={content} onChange={setAcademicContent} language={state.language} />
      }
      preview={<PreviewPanel content={content} language={state.language} reviewChange={reviewChange} isStreaming={isAgentRunning} />}
      isAgentMode={isAgentMode}
      isLLMConfigured={isLLMConfigured}
    />
  );
}
