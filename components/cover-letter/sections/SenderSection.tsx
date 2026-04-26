"use client";

import { ChevronDown, Plus, Trash2 } from "lucide-react";
import type { CoverLetterSender } from "@/lib/types/cover-letter";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
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

  const addressLines = data.addressLines ?? [];

  function addAddressLine() {
    onChange({ ...data, addressLines: [...addressLines, { id: crypto.randomUUID(), value: "" }] });
  }

  function updateAddressLine(id: string, value: string) {
    onChange({ ...data, addressLines: addressLines.map((l) => l.id === id ? { ...l, value } : l) });
  }

  function removeAddressLine(id: string) {
    onChange({ ...data, addressLines: addressLines.filter((l) => l.id !== id) });
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
            <Input value={data.name} onChange={(e) => onChange({ ...data, name: e.target.value })} placeholder="Your Name" />
          </div>

          {addressLines.map((line, i) => (
            <div key={line.id} className="grid gap-1.5">
              <div className="flex items-center justify-between">
                <Label className="text-xs">{tr.addressLine} {i + 1}</Label>
                <Button
                  variant="ghost" size="icon-xs"
                  className="cursor-pointer text-muted-foreground hover:text-destructive"
                  onClick={() => removeAddressLine(line.id)}
                >
                  <Trash2 className="size-3" />
                </Button>
              </div>
              <Input
                value={line.value}
                onChange={(e) => updateAddressLine(line.id, e.target.value)}
                placeholder="Please enter your address here."
              />
            </div>
          ))}

          <button
            type="button"
            className="add-btn inline-flex h-7 w-fit cursor-pointer items-center gap-1 rounded-md px-2 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            onClick={addAddressLine}
          >
            <Plus className="size-3" />
            {tr.addressLine}
          </button>
        </div>
      )}
    </section>
  );
}
