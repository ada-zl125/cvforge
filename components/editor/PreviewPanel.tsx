"use client";

import type { ResumeContent, ResumeLanguage } from "@/lib/types/resume";
import { PaginatedPreviewPanel } from "@/components/shared/PaginatedPreviewPanel";
import { GeneralTemplate } from "./templates/GeneralTemplate";

interface PreviewPanelProps {
  content: ResumeContent;
  language: ResumeLanguage;
}

export function PreviewPanel({ content, language }: PreviewPanelProps) {
  return (
    <PaginatedPreviewPanel>
      <GeneralTemplate content={content} language={language} />
    </PaginatedPreviewPanel>
  );
}
