"use client";

import { createContext, useContext, useState } from "react";

export type UILang = "en" | "zh";

const STORAGE_KEY = "cvforge-ui-lang";

function isUILang(value: string | null | undefined): value is UILang {
  return value === "en" || value === "zh";
}

interface UILanguageContextValue {
  lang: UILang;
  setLang: (lang: UILang) => void;
}

const UILanguageContext = createContext<UILanguageContextValue>({
  lang: "en",
  setLang: () => {},
});

export function UILanguageProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [lang, setLangState] = useState<UILang>(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (isUILang(stored)) return stored;
    }
    return "en";
  });

  function setLang(l: UILang) {
    setLangState(l);
    if (typeof window !== "undefined") {
      localStorage.setItem(STORAGE_KEY, l);
    }
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
