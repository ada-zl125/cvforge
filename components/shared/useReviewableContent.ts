"use client";

import { useCallback, useMemo, useState } from "react";
import { contentSignature, type AgentChange } from "@/lib/agent/change-tracking";

interface UseReviewableContentOptions<TContent> {
  normalize?: (content: TContent) => TContent;
}

export function useReviewableContent<TContent>(
  sourceContent: TContent,
  persistContent: (content: TContent) => void,
  options: UseReviewableContentOptions<TContent> = {},
) {
  const { normalize } = options;
  const [reviewChange, setReviewChange] = useState<AgentChange | null>(null);
  const content = useMemo(
    () => normalize ? normalize(sourceContent) : sourceContent,
    [normalize, sourceContent],
  );

  const setContent = useCallback((nextContent: TContent) => {
    const normalized = normalize ? normalize(nextContent) : nextContent;
    if (reviewChange && contentSignature(normalized) !== reviewChange.afterSignature) {
      setReviewChange(null);
    }
    persistContent(normalized);
  }, [normalize, persistContent, reviewChange]);

  return {
    content,
    reviewChange,
    setContent,
    setReviewChange,
  };
}
