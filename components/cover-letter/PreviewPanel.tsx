"use client";

import type { CoverLetterContent } from "@/lib/types/cover-letter";
import { PaginatedPreviewPanel } from "@/components/shared/PaginatedPreviewPanel";
import { CoverLetterTemplate } from "./templates/CoverLetterTemplate";
import type { AgentChange } from "@/lib/agent/change-tracking";

interface Props {
  content: CoverLetterContent;
  reviewChange?: AgentChange | null;
}

export function PreviewPanel({ content, reviewChange }: Props) {
  return (
    <PaginatedPreviewPanel reviewChange={reviewChange}>
      <CoverLetterTemplate content={content} />
    </PaginatedPreviewPanel>
  );
}
