"use client";

import { useState } from "react";
import type { ResumeContent, ResumeTemplate, ResumeLanguage } from "@/lib/types/resume";
import { defaultResumeContent, RESUME_STORAGE_KEY } from "@/lib/defaults";
import { useEditorState } from "@/lib/editor-state";
import { EditorFrame } from "@/components/shared/EditorFrame";
import { Toolbar } from "./Toolbar";
import { FormPanel } from "./FormPanel";
import { PreviewPanel } from "./PreviewPanel";
import { ChatPanel } from "@/components/shared/ChatPanel";

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
          content={state.content}
          onSettingsChange={handleSettingsChange}
          onImport={setStoredState}
        />
      }
      form={
        isAgentMode
          ? <ChatPanel docType="resume" content={state.content} onChange={setContent} />
          : <FormPanel content={state.content} onChange={setContent} language={state.language} />
      }
      preview={<PreviewPanel content={state.content} language={state.language} />}
      isAgentMode={isAgentMode}
      onModeToggle={() => setIsAgentMode((v) => !v)}
    />
  );
}
