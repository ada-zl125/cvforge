"use client";

import { Check, Languages } from "lucide-react";
import { useUILanguage } from "@/lib/ui-language";
import { t } from "@/lib/translations";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface LanguageSwitcherProps {
  className?: string;
}

export function LanguageSwitcher({ className = "" }: LanguageSwitcherProps) {
  const { lang, setLang } = useUILanguage();
  const tr = t[lang];
  const title = tr.switchInterfaceLanguage;
  const options = [
    { value: "en" as const, label: tr.langEnglish },
    { value: "zh" as const, label: tr.langChinese },
  ];

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="icon"
          className={`language-switcher-trigger cursor-pointer rounded-full ${className}`}
          title={title}
          aria-label={title}
        >
          <Languages className="size-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-32">
        {options.map((option) => (
          <DropdownMenuItem
            key={option.value}
            className="cursor-pointer justify-between gap-3"
            onClick={() => setLang(option.value)}
          >
            <span>{option.label}</span>
            {lang === option.value && <Check className="size-4 text-foreground" />}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
