"use client";

import { t } from "@/lib/translations";
import { useUILanguage } from "@/lib/ui-language";
import type { ResumeLanguage } from "@/lib/types/resume";

interface SummarySectionProps {
  value: string;
  onChange: (value: string) => void;
  language?: ResumeLanguage;
}

export function SummarySection({ value, onChange }: SummarySectionProps) {
  const { lang } = useUILanguage();
  const tr = t[lang];

  return (
    <textarea
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={tr.summaryPlaceholder}
      rows={4}
      className="w-full resize-none rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
    />
  );
}
