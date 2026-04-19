"use client";

import { useReducer, useCallback, useEffect } from "react";
import type { CoverLetterContent, CoverLetterTemplate } from "@/lib/types/cover-letter";
import { defaultCoverLetterContent, COVER_LETTER_STORAGE_KEY } from "@/lib/defaults";
import { readEditorState, writeEditorState } from "@/lib/storage";
import { Toolbar } from "./Toolbar";
import { FormPanel } from "./FormPanel";
import { PreviewPanel } from "./PreviewPanel";

/* ---- State ---- */

interface EditorState {
  title: string;
  template: CoverLetterTemplate;
  content: CoverLetterContent;
  hydrated: boolean;
}

const initialState: EditorState = {
  title: "My Cover Letter",
  template: "classic",
  content: defaultCoverLetterContent,
  hydrated: false,
};

type EditorAction =
  | { type: "HYDRATE"; payload: Omit<EditorState, "hydrated"> }
  | { type: "SET_CONTENT"; content: CoverLetterContent }
  | { type: "SET_TITLE"; title: string };

function reducer(state: EditorState, action: EditorAction): EditorState {
  switch (action.type) {
    case "HYDRATE":
      return { ...action.payload, hydrated: true };
    case "SET_CONTENT":
      return { ...state, content: action.content };
    case "SET_TITLE":
      return { ...state, title: action.title };
  }
}

/* ---- Component ---- */

export function CoverLetterEditorContent() {
  const [state, dispatch] = useReducer(reducer, initialState);

  useEffect(() => {
    const stored = readEditorState<EditorState, CoverLetterContent>(COVER_LETTER_STORAGE_KEY, defaultCoverLetterContent);
    dispatch({
      type: "HYDRATE",
      payload: stored ?? {
        title: initialState.title,
        template: initialState.template,
        content: initialState.content,
      },
    });
  }, []);

  const persist = useCallback((next: Omit<EditorState, "hydrated">) => {
    writeEditorState(COVER_LETTER_STORAGE_KEY, next);
  }, []);

  function handleContentChange(newContent: CoverLetterContent) {
    dispatch({ type: "SET_CONTENT", content: newContent });
    persist({ title: state.title, template: state.template, content: newContent });
  }

  function handleTitleChange(newTitle: string) {
    dispatch({ type: "SET_TITLE", title: newTitle });
    persist({ title: newTitle, template: state.template, content: state.content });
  }

  if (!state.hydrated) return null;

  return (
    <div className="flex h-screen flex-col">
      <Toolbar title={state.title} onTitleChange={handleTitleChange} />

      <div className="flex flex-1 overflow-hidden">
        {/* Left: Form panel (40%) */}
        <div className="w-2/5 shrink-0 overflow-y-auto border-r border-border">
          <FormPanel content={state.content} onChange={handleContentChange} />
        </div>

        {/* Right: Preview panel (60%) */}
        <PreviewPanel content={state.content} />
      </div>
    </div>
  );
}
