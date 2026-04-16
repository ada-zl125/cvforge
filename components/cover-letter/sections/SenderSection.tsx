"use client";

import { ChevronDown } from "lucide-react";
import type { CoverLetterSender } from "@/lib/types/cover-letter";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useUILanguage } from "@/lib/ui-language";
import { t } from "@/lib/translations";

interface Props {
  data: CoverLetterSender;
  onChange: (data: CoverLetterSender) => void;
  collapsed: boolean;
  onToggleCollapse: () => void;
}

export function SenderSection({ data, onChange, collapsed, onToggleCollapse }: Props) {
  const { lang } = useUILanguage();
  const tr = t[lang].coverLetter;

  function update<K extends keyof CoverLetterSender>(field: K, value: CoverLetterSender[K]) {
    onChange({ ...data, [field]: value });
  }

  return (
    <section className="section-card rounded-lg border border-border">
      <button
        type="button"
        className="section-header flex w-full cursor-pointer items-center justify-between px-4 py-3 text-sm font-semibold tracking-tight transition-colors hover:text-foreground"
        onClick={onToggleCollapse}
      >
        {tr.sectionSender}
        <ChevronDown className={`size-4 text-muted-foreground transition-transform duration-200 ${collapsed ? "-rotate-90" : ""}`} />
      </button>

      {!collapsed && (
        <div className="grid gap-2 border-t border-border px-4 pb-4 pt-3">
          <div className="grid gap-1.5">
            <Label className="text-xs">{tr.senderName}</Label>
            <Input value={data.name} onChange={(e) => update("name", e.target.value)} placeholder="Your Name" />
          </div>
          <div className="grid gap-1.5">
            <Label className="text-xs">{tr.senderAddress1}</Label>
            <Input value={data.addressLine1} onChange={(e) => update("addressLine1", e.target.value)} placeholder="000 Memorial Drive, # 0000" />
          </div>
          <div className="grid gap-1.5">
            <Label className="text-xs">{tr.senderAddress2}</Label>
            <Input value={data.addressLine2} onChange={(e) => update("addressLine2", e.target.value)} placeholder="Cambridge, MA 02139" />
          </div>
        </div>
      )}
    </section>
  );
}
