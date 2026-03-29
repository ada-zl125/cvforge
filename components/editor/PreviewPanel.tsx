"use client";

import type { ResumeContent, ResumeLanguage } from "@/lib/types/resume";
import { GeneralTemplate } from "./templates/GeneralTemplate";

interface PreviewPanelProps {
  content: ResumeContent;
  language: ResumeLanguage;
}

export function PreviewPanel({ content, language }: PreviewPanelProps) {
  return (
    <div className="flex flex-1 items-start justify-center overflow-y-auto bg-muted/50 p-8">
      <div className="preview-a4 overflow-hidden rounded-sm border border-border shadow-lg">
        <GeneralTemplate content={content} language={language} />
      </div>
    </div>
  );
}
