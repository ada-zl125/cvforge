"use client";

import { Check, Languages } from "lucide-react";
import { useUILanguage } from "@/lib/ui-language";
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
  const title = lang === "zh" ? "切换界面语言" : "Switch interface language";
  const options = [
    { value: "en" as const, label: "English" },
    { value: "zh" as const, label: "中文" },
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
