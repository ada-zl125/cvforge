"use client";

import { FilePlus, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useUILanguage } from "@/lib/ui-language";
import { t } from "@/lib/translations";

interface EmptyStateProps {
  onNewResume: () => void;
}

export function EmptyState({ onNewResume }: EmptyStateProps) {
  const { lang } = useUILanguage();
  const tr = t[lang];

  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-5">
      <div className="flex size-[72px] items-center justify-center rounded-full bg-muted">
        <FilePlus className="size-8 text-muted-foreground" />
      </div>

      <div className="flex flex-col items-center gap-1.5 text-center">
        <h2 className="text-lg font-semibold">{tr.noResumesTitle}</h2>
        <p className="max-w-[280px] text-sm text-muted-foreground">
          {tr.noResumesDesc}
        </p>
      </div>

      <Button variant="outline" className="btn-hover-border cursor-pointer gap-2" onClick={onNewResume}>
        <Plus className="size-4" />
        {tr.createFirstResume}
      </Button>
    </div>
  );
}
