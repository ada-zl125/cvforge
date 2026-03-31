"use client";

import { createContext, useContext, useEffect, useState } from "react";

export type UILang = "en" | "zh";

const STORAGE_KEY = "easycv-ui-lang";

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
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === "en" || stored === "zh") setLangState(stored);
  }, []);

  function setLang(l: UILang) {
    setLangState(l);
    localStorage.setItem(STORAGE_KEY, l);
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
