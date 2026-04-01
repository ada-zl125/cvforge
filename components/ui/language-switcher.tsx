"use client";

import { useUILanguage } from "@/lib/ui-language";

interface LanguageSwitcherProps {
  className?: string;
}

export function LanguageSwitcher({ className = "" }: LanguageSwitcherProps) {
  const { lang, setLang } = useUILanguage();

  return (
    <div className={`flex items-center gap-0.5 text-sm ${className}`}>
      <button
        type="button"
        onClick={() => setLang("en")}
        className={`cursor-pointer rounded px-1.5 py-0.5 transition-colors ${
          lang === "en"
            ? "font-medium text-foreground"
            : "text-muted-foreground hover:text-foreground"
        }`}
      >
        EN
      </button>
      <span className="text-muted-foreground/40 select-none">|</span>
      <button
        type="button"
        onClick={() => setLang("zh")}
        className={`cursor-pointer rounded px-1.5 py-0.5 transition-colors ${
          lang === "zh"
            ? "font-medium text-foreground"
            : "text-muted-foreground hover:text-foreground"
        }`}
      >
        中文
      </button>
    </div>
  );
}
