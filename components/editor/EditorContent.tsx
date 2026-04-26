"use client";

import type { ResumeContent, ResumeTemplate, ResumeLanguage } from "@/lib/types/resume";
import { defaultResumeContent, RESUME_STORAGE_KEY } from "@/lib/defaults";
import { useEditorState } from "@/lib/editor-state";
import { EditorFrame } from "@/components/shared/EditorFrame";
import { Toolbar } from "./Toolbar";
import { FormPanel } from "./FormPanel";
import { PreviewPanel } from "./PreviewPanel";

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
      form={<FormPanel content={state.content} onChange={setContent} language={state.language} />}
      preview={<PreviewPanel content={state.content} language={state.language} />}
    />
  );
}
