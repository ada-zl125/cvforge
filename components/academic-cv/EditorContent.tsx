"use client";

import { useState } from "react";
import type { AcademicCVContent, AcademicCVTemplate, ResumeLanguage } from "@/lib/types/academic-cv";
import { defaultAcademicCVContent, ACADEMIC_CV_STORAGE_KEY } from "@/lib/defaults";
import { useEditorState } from "@/lib/editor-state";
import { EditorFrame } from "@/components/shared/EditorFrame";
import { Toolbar } from "./Toolbar";
import { FormPanel } from "./FormPanel";
import { PreviewPanel } from "./PreviewPanel";
import { ChatPanel } from "@/components/shared/ChatPanel";

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
          ? <ChatPanel docType="academic-cv" content={state.content} onChange={setContent} />
          : <FormPanel content={state.content} onChange={setContent} language={state.language} />
      }
      preview={<PreviewPanel content={state.content} language={state.language} />}
      isAgentMode={isAgentMode}
      onModeToggle={() => setIsAgentMode((v) => !v)}
    />
  );
}
