"use client";

import { useReducer, useCallback, useEffect } from "react";
import type { ResumeContent, ResumeTemplate, ResumeLanguage } from "@/lib/types/resume";
import { defaultResumeContent, RESUME_STORAGE_KEY } from "@/lib/defaults";
import { readEditorState, writeEditorState } from "@/lib/storage";
import { Toolbar } from "./Toolbar";
import { FormPanel } from "./FormPanel";
import { PreviewPanel } from "./PreviewPanel";

/* ---- State ---- */

interface EditorState {
  title: string;
  template: ResumeTemplate;
  language: ResumeLanguage;
  content: ResumeContent;
  hydrated: boolean;
}

const initialState: EditorState = {
  title: "My Resume",
  template: "general",
  language: "en",
  content: defaultResumeContent,
  hydrated: false,
};

type EditorAction =
  | { type: "HYDRATE"; payload: Omit<EditorState, "hydrated"> }
  | { type: "SET_CONTENT"; content: ResumeContent }
  | { type: "SET_SETTINGS"; title: string; language: ResumeLanguage; template: ResumeTemplate };

function reducer(state: EditorState, action: EditorAction): EditorState {
  switch (action.type) {
    case "HYDRATE":
      return { ...action.payload, hydrated: true };
    case "SET_CONTENT":
      return { ...state, content: action.content };
    case "SET_SETTINGS":
      return { ...state, title: action.title, language: action.language, template: action.template };
  }
}

/* ---- Component ---- */

export function EditorContent() {
  const [state, dispatch] = useReducer(reducer, initialState);

  // Hydrate from localStorage on mount — single dispatch, no cascading setState
  useEffect(() => {
    const stored = readEditorState<EditorState, ResumeContent>(RESUME_STORAGE_KEY, defaultResumeContent);
    dispatch({
      type: "HYDRATE",
      payload: stored ?? {
        title: initialState.title,
        template: initialState.template,
        language: initialState.language,
        content: initialState.content,
      },
    });
  }, []);

  const persist = useCallback((next: Omit<EditorState, "hydrated">) => {
    writeEditorState(RESUME_STORAGE_KEY, next);
  }, []);

  function handleContentChange(newContent: ResumeContent) {
    dispatch({ type: "SET_CONTENT", content: newContent });
    persist({ title: state.title, template: state.template, language: state.language, content: newContent });
  }

  function handleSettingsChange(newTitle: string, newLanguage: ResumeLanguage, newTemplate: ResumeTemplate) {
    dispatch({ type: "SET_SETTINGS", title: newTitle, language: newLanguage, template: newTemplate });
    persist({ title: newTitle, template: newTemplate, language: newLanguage, content: state.content });
  }

  function handleImport(imported: { title: string; template: ResumeTemplate; language: ResumeLanguage; content: ResumeContent }) {
    dispatch({ type: "HYDRATE", payload: imported });
    persist(imported);
  }

  if (!state.hydrated) return null;

  return (
    <div className="flex h-screen flex-col">
      <Toolbar
        title={state.title}
        template={state.template}
        language={state.language}
        content={state.content}
        onSettingsChange={handleSettingsChange}
        onImport={handleImport}
      />

      <div className="-mt-px flex min-h-0 flex-1 overflow-hidden">
        {/* Left: Form panel (40%) */}
        <div className="editor-form-pane relative z-10 w-2/5 shrink-0 overflow-y-auto rounded-tr-lg border-r border-t border-border">
          <FormPanel content={state.content} onChange={handleContentChange} language={state.language} />
        </div>

        {/* Right: Preview panel (60%) */}
        <PreviewPanel content={state.content} language={state.language} />
      </div>
    </div>
  );
}
