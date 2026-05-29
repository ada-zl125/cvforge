"use client";

import { createContext, useContext, useSyncExternalStore } from "react";

export type UILang = "en" | "zh";

const STORAGE_KEY = "cvforge-ui-lang";
const CHANGE_EVENT = "cvforge-ui-lang-change";

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

function getStoredLanguage(): UILang {
  if (typeof window === "undefined") return "en";
  const stored = localStorage.getItem(STORAGE_KEY);
  return isUILang(stored) ? stored : "en";
}

function subscribeToLanguageChange(onStoreChange: () => void) {
  window.addEventListener(CHANGE_EVENT, onStoreChange);
  window.addEventListener("storage", onStoreChange);
  return () => {
    window.removeEventListener(CHANGE_EVENT, onStoreChange);
    window.removeEventListener("storage", onStoreChange);
  };
}

function getServerLanguage(): UILang {
  return "en";
}

export function UILanguageProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const lang = useSyncExternalStore(subscribeToLanguageChange, getStoredLanguage, getServerLanguage);

  function setLang(l: UILang) {
    localStorage.setItem(STORAGE_KEY, l);
    window.dispatchEvent(new Event(CHANGE_EVENT));
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
