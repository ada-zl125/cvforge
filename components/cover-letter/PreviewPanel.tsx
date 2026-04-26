"use client";

import type { CoverLetterContent } from "@/lib/types/cover-letter";
import { PaginatedPreviewPanel } from "@/components/shared/PaginatedPreviewPanel";
import { CoverLetterTemplate } from "./templates/CoverLetterTemplate";

interface Props {
  content: CoverLetterContent;
}

export function PreviewPanel({ content }: Props) {
  return (
    <PaginatedPreviewPanel>
      <CoverLetterTemplate content={content} />
    </PaginatedPreviewPanel>
  );
}
