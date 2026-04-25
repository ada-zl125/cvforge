"use client";

import { createContext, useContext, useEffect, useState } from "react";

export type UILang = "en" | "zh";

const STORAGE_KEY = "cvforge-ui-lang";

interface UILanguageContextValue {
  lang: UILang;
  setLang: (lang: UILang) => void;
}

const UILanguageContext = createContext<UILanguageContextValue>({
  lang: "en",
  setLang: () => {},
});

export function UILanguageProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<UILang>("en");

  useEffect(() => {
    let cancelled = false;

    queueMicrotask(() => {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (!cancelled && (stored === "en" || stored === "zh")) setLangState(stored);
    });

    return () => {
      cancelled = true;
    };
  }, []);

  function setLang(l: UILang) {
    setLangState(l);
    if (typeof window !== "undefined") localStorage.setItem(STORAGE_KEY, l);
  }

  return (
    <UILanguageContext.Provider value={{ lang, setLang }}>
      {children}
    </UILanguageContext.Provider>
  );
}

export function useUILanguage() {
  return useContext(UILanguageContext);
}
