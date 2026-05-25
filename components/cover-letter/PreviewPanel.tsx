"use client";

import type { CoverLetterContent } from "@/lib/types/cover-letter";
import { PaginatedPreviewPanel } from "@/components/shared/PaginatedPreviewPanel";
import { CoverLetterTemplate } from "./templates/CoverLetterTemplate";
import type { AgentChange } from "@/lib/agent/change-tracking";

interface Props {
  content: CoverLetterContent;
  reviewChange?: AgentChange | null;
  isStreaming?: boolean;
}

export function PreviewPanel({ content, reviewChange, isStreaming = false }: Props) {
  return (
    <PaginatedPreviewPanel reviewChange={reviewChange} isStreaming={isStreaming}>
      <CoverLetterTemplate content={content} />
    </PaginatedPreviewPanel>
  );
}
