"use client";

import { useState } from "react";
import type { CoverLetterContent, CoverLetterTemplate } from "@/lib/types/cover-letter";
import { defaultCoverLetterContent, COVER_LETTER_STORAGE_KEY } from "@/lib/defaults";
import { useEditorState } from "@/lib/editor-state";
import { EditorFrame } from "@/components/shared/EditorFrame";
import { Toolbar } from "./Toolbar";
import { FormPanel } from "./FormPanel";
import { PreviewPanel } from "./PreviewPanel";
import { ChatPanel } from "@/components/shared/ChatPanel";

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
          ? <ChatPanel docType="cover-letter" content={state.content} onChange={setContent} />
          : <FormPanel content={state.content} onChange={setContent} />
      }
      preview={<PreviewPanel content={state.content} />}
      isAgentMode={isAgentMode}
      onModeToggle={() => setIsAgentMode((v) => !v)}
    />
  );
}
