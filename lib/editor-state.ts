"use client";

import { useCallback, useEffect, useReducer, useRef } from "react";
import { readEditorState, writeEditorState } from "@/lib/storage";

export type EditorState<TContent, TTemplate, TLanguage = never> =
  [TLanguage] extends [never]
    ? {
        title: string;
        template: TTemplate;
        content: TContent;
        hydrated: boolean;
      }
    : {
        title: string;
        template: TTemplate;
        language: TLanguage;
        content: TContent;
        hydrated: boolean;
      };

type StoredState<TContent, TTemplate, TLanguage> = Omit<
  EditorState<TContent, TTemplate, TLanguage>,
  "hydrated"
>;

type EditorAction<TContent, TTemplate, TLanguage> =
  | { type: "HYDRATE"; payload: StoredState<TContent, TTemplate, TLanguage> }
  | { type: "SET_CONTENT"; content: TContent }
  | { type: "SET_STATE"; payload: StoredState<TContent, TTemplate, TLanguage> };

function reducer<TContent, TTemplate, TLanguage>(
  state: EditorState<TContent, TTemplate, TLanguage>,
  action: EditorAction<TContent, TTemplate, TLanguage>,
): EditorState<TContent, TTemplate, TLanguage> {
  switch (action.type) {
    case "HYDRATE":
      return { ...action.payload, hydrated: true } as EditorState<TContent, TTemplate, TLanguage>;
    case "SET_CONTENT":
      return { ...state, content: action.content };
    case "SET_STATE":
      return { ...action.payload, hydrated: true } as EditorState<TContent, TTemplate, TLanguage>;
  }
}

function toStoredState<TContent, TTemplate, TLanguage>(
  state: EditorState<TContent, TTemplate, TLanguage>,
): StoredState<TContent, TTemplate, TLanguage> {
  const stored = { ...state } as Partial<EditorState<TContent, TTemplate, TLanguage>>;
  delete stored.hydrated;
  return stored as StoredState<TContent, TTemplate, TLanguage>;
}

export function useEditorState<TContent, TTemplate, TLanguage = never>({
  storageKey,
  initialState,
  defaultContent,
}: {
  storageKey: string;
  initialState: StoredState<TContent, TTemplate, TLanguage>;
  defaultContent: TContent;
}) {
  const [state, dispatch] = useReducer(
    reducer<TContent, TTemplate, TLanguage>,
    { ...initialState, hydrated: false } as EditorState<TContent, TTemplate, TLanguage>,
  );
  const stateRef = useRef(state);

  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  useEffect(() => {
    const stored = readEditorState<
      EditorState<TContent, TTemplate, TLanguage>,
      TContent
    >(storageKey, defaultContent);
    const next = stored ?? initialState;
    stateRef.current = {
      ...next,
      hydrated: true,
    } as EditorState<TContent, TTemplate, TLanguage>;
    dispatch({ type: "HYDRATE", payload: next });
  }, [defaultContent, initialState, storageKey]);

  const persist = useCallback(
    (next: StoredState<TContent, TTemplate, TLanguage>) => {
      writeEditorState(storageKey, next);
    },
    [storageKey],
  );

  const setContent = useCallback(
    (content: TContent) => {
      const nextState = { ...stateRef.current, content };
      stateRef.current = nextState;
      dispatch({ type: "SET_CONTENT", content });
      const stored = toStoredState(nextState);
      persist({ ...stored, content } as StoredState<TContent, TTemplate, TLanguage>);
    },
    [persist],
  );

  const setStoredState = useCallback(
    (next: StoredState<TContent, TTemplate, TLanguage>) => {
      stateRef.current = {
        ...next,
        hydrated: true,
      } as EditorState<TContent, TTemplate, TLanguage>;
      dispatch({ type: "SET_STATE", payload: next });
      persist(next);
    },
    [persist],
  );

  return { state, setContent, setStoredState };
}
