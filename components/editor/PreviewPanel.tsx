"use client";

import type { ResumeContent, ResumeLanguage } from "@/lib/types/resume";
import { PaginatedPreviewPanel } from "@/components/shared/PaginatedPreviewPanel";
import { GeneralTemplate } from "./templates/GeneralTemplate";
import type { AgentChange } from "@/lib/agent/change-tracking";

interface PreviewPanelProps {
  content: ResumeContent;
  language: ResumeLanguage;
  reviewChange?: AgentChange | null;
}

export function PreviewPanel({ content, language, reviewChange }: PreviewPanelProps) {
  return (
    <PaginatedPreviewPanel reviewChange={reviewChange}>
      <GeneralTemplate content={content} language={language} />
    </PaginatedPreviewPanel>
  );
}
