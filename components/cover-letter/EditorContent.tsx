"use client";

import type { CoverLetterContent, CoverLetterTemplate } from "@/lib/types/cover-letter";
import { defaultCoverLetterContent, COVER_LETTER_AGENT_STORAGE_KEY, COVER_LETTER_STORAGE_KEY } from "@/lib/defaults";
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
  template: CoverLetterTemplate;
  content: CoverLetterContent;
}

const initialState: EditorState = {
  title: "My Cover Letter",
  template: "classic",
  content: defaultCoverLetterContent,
};

export function CoverLetterEditorContent() {
  const { state, setContent, setStoredState } = useEditorState<
    CoverLetterContent,
    CoverLetterTemplate
  >({
    storageKey: COVER_LETTER_STORAGE_KEY,
    initialState,
    defaultContent: defaultCoverLetterContent,
  });
  const {
    isAgentMode,
    isAgentRunning,
    agentState,
    isLLMConfigured,
    setIsAgentRunning,
    setAgentState,
    toggleAgentMode,
  } = useAgentEditorState(COVER_LETTER_AGENT_STORAGE_KEY);
  const {
    content,
    reviewChange,
    setContent: setCoverLetterContent,
    setReviewChange,
  } = useReviewableContent(state.content, setContent);

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
          content={content}
          template={state.template}
          isAgentMode={isAgentMode}
          onTitleChange={handleTitleChange}
          onImport={setStoredState}
          onModeToggle={toggleAgentMode}
        />
      }
      form={
        isAgentMode
          ? (
            <ChatPanel
              docType="cover-letter"
              documentLanguage="en"
              content={content}
              onChange={setCoverLetterContent}
              onReviewChange={setReviewChange}
              onAgentRunningChange={setIsAgentRunning}
              agentState={agentState}
              onAgentStateChange={setAgentState}
            />
          )
          : <FormPanel content={content} onChange={setCoverLetterContent} />
      }
      preview={<PreviewPanel content={content} reviewChange={reviewChange} isStreaming={isAgentRunning} />}
      isAgentMode={isAgentMode}
      isLLMConfigured={isLLMConfigured}
    />
  );
}
