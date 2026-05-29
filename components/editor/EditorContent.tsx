"use client";

import type { ResumeContent, ResumeTemplate, ResumeLanguage } from "@/lib/types/resume";
import { defaultResumeContent, RESUME_AGENT_STORAGE_KEY, RESUME_STORAGE_KEY } from "@/lib/defaults";
import { useEditorState } from "@/lib/editor-state";
import { EditorFrame } from "@/components/shared/EditorFrame";
import { Toolbar } from "./Toolbar";
import { FormPanel } from "./FormPanel";
import { PreviewPanel } from "./PreviewPanel";
import { ChatPanel } from "@/components/shared/ChatPanel";
import { useAgentEditorState } from "@/components/shared/useAgentEditorState";
import { useReviewableContent } from "@/components/shared/useReviewableContent";
import { stripResumeLegacyContacts } from "@/lib/json-utils";

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
  const { state, setContent, setStoredState } = useEditorState<
    ResumeContent,
    ResumeTemplate,
    ResumeLanguage
  >({
    storageKey: RESUME_STORAGE_KEY,
    initialState,
    defaultContent: defaultResumeContent,
  });
  const {
    isAgentMode,
    isAgentRunning,
    agentState,
    isLLMConfigured,
    setIsAgentRunning,
    setAgentState,
    toggleAgentMode,
  } = useAgentEditorState(RESUME_AGENT_STORAGE_KEY);
  const {
    content,
    reviewChange,
    setContent: setResumeContent,
    setReviewChange,
  } = useReviewableContent(state.content, setContent, {
    normalize: stripResumeLegacyContacts,
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
      isLLMConfigured={isLLMConfigured}
    />
  );
}
