"use client";

import { useReducer, useCallback, useEffect } from "react";
import type { AcademicCVContent, AcademicCVTemplate, ResumeLanguage } from "@/lib/types/academic-cv";
import { defaultAcademicCVContent, ACADEMIC_CV_STORAGE_KEY } from "@/lib/defaults";
import { Toolbar } from "./Toolbar";
import { FormPanel } from "./FormPanel";
import { PreviewPanel } from "./PreviewPanel";

/* ---- State ---- */

interface EditorState {
  title: string;
  template: AcademicCVTemplate;
  language: ResumeLanguage;
  content: AcademicCVContent;
  hydrated: boolean;
}

const initialState: EditorState = {
  title: "My Academic CV",
  template: "academic",
  language: "en",
  content: defaultAcademicCVContent,
  hydrated: false,
};

type EditorAction =
  | { type: "HYDRATE"; payload: Omit<EditorState, "hydrated"> }
  | { type: "SET_CONTENT"; content: AcademicCVContent }
  | { type: "SET_SETTINGS"; title: string; language: ResumeLanguage; template: AcademicCVTemplate };

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

/* ---- Storage ---- */

function loadFromStorage(): Omit<EditorState, "hydrated"> | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(ACADEMIC_CV_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    // Normalize content: merge with defaults so all required array fields are present.
    // Guards against old localStorage data and partial saves.
    if (parsed?.content) {
      parsed.content = { ...defaultAcademicCVContent, ...parsed.content };
    }
    return parsed;
  } catch {
    return null;
  }
}

function saveToStorage(state: Omit<EditorState, "hydrated">) {
  try {
    localStorage.setItem(ACADEMIC_CV_STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Storage quota exceeded — silently ignore
  }
}

/* ---- Component ---- */

export function AcademicEditorContent() {
  const [state, dispatch] = useReducer(reducer, initialState);

  useEffect(() => {
    const stored = loadFromStorage();
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
    saveToStorage(next);
  }, []);

  function handleContentChange(newContent: AcademicCVContent) {
    dispatch({ type: "SET_CONTENT", content: newContent });
    persist({ title: state.title, template: state.template, language: state.language, content: newContent });
  }

  function handleSettingsChange(newTitle: string, newLanguage: ResumeLanguage, newTemplate: AcademicCVTemplate) {
    dispatch({ type: "SET_SETTINGS", title: newTitle, language: newLanguage, template: newTemplate });
    persist({ title: newTitle, template: newTemplate, language: newLanguage, content: state.content });
  }

  if (!state.hydrated) return null;

  return (
    <div className="flex h-screen flex-col">
      <Toolbar
        title={state.title}
        template={state.template}
        language={state.language}
        onSettingsChange={handleSettingsChange}
      />

      <div className="flex flex-1 overflow-hidden">
        {/* Left: Form panel (40%) */}
        <div className="w-2/5 shrink-0 overflow-y-auto border-r border-border">
          <FormPanel content={state.content} onChange={handleContentChange} language={state.language} />
        </div>

        {/* Right: Preview panel (60%) */}
        <PreviewPanel content={state.content} language={state.language} />
      </div>
    </div>
  );
}
