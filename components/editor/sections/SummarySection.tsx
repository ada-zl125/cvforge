"use client";

import { t } from "@/lib/translations";
import { useUILanguage } from "@/lib/ui-language";
import { Textarea } from "@/components/ui/textarea";
import { normalizeTextareaValue } from "@/lib/text";
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
    <Textarea
      value={normalizeTextareaValue(value)}
      onChange={(e) => onChange(normalizeTextareaValue(e.target.value))}
      placeholder={tr.summaryPlaceholder}
      rows={4}
      className="text-sm"
    />
  );
}
