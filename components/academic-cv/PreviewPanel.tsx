"use client";

import type { AcademicCVContent, ResumeLanguage } from "@/lib/types/academic-cv";
import { PaginatedPreviewPanel } from "@/components/shared/PaginatedPreviewPanel";
import { AcademicTemplate } from "./templates/AcademicTemplate";
import type { AgentChange } from "@/lib/agent/change-tracking";

interface PreviewPanelProps {
  content: AcademicCVContent;
  language: ResumeLanguage;
  reviewChange?: AgentChange | null;
}

export function PreviewPanel({ content, language, reviewChange }: PreviewPanelProps) {
  return (
    <PaginatedPreviewPanel reviewChange={reviewChange}>
      <AcademicTemplate content={content} language={language} />
    </PaginatedPreviewPanel>
  );
}
