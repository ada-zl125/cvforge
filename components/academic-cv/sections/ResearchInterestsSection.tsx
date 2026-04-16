"use client";

import { useUILanguage } from "@/lib/ui-language";
import { t } from "@/lib/translations";

interface ResearchInterestsSectionProps {
  value: string;
  onChange: (value: string) => void;
}

export function ResearchInterestsSection({ value, onChange }: ResearchInterestsSectionProps) {
  const { lang } = useUILanguage();
  const tr = t[lang].academicCv;

  return (
    <textarea
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={tr.researchInterestsPlaceholder}
      rows={4}
      className="w-full resize-none rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
    />
  );
}
