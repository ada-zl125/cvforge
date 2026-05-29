"use client";

import { ChevronDown, Plus, Trash2 } from "lucide-react";
import type { CoverLetterRecipient } from "@/lib/types/cover-letter";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import { useUILanguage } from "@/lib/ui-language";
import { t } from "@/lib/translations";

interface Props {
  data: CoverLetterRecipient;
  date: string;
  onDateChange: (date: string) => void;
  onChange: (data: CoverLetterRecipient) => void;
  collapsed: boolean;
  onToggleCollapse: () => void;
}

export function RecipientSection({ data, date, onDateChange, onChange, collapsed, onToggleCollapse }: Props) {
  const { lang } = useUILanguage();
  const tr = t[lang].coverLetter;

  const addressLines = data.addressLines ?? [];
  const hasSalutation = data.salutation !== undefined;

  const dropdownItems: { key: string; label: string }[] = [
    ...(!hasSalutation ? [{ key: "salutation", label: tr.salutation }] : []),
    { key: "addressLine", label: tr.addressLine },
  ];

  function addSalutation() {
    onChange({ ...data, salutation: "" });
  }

  function addAddressLine() {
    onChange({ ...data, addressLines: [...addressLines, { id: crypto.randomUUID(), value: "" }] });
  }

  function removeSalutation() {
    const next = { ...data };
    delete next.salutation;
    onChange(next);
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
        {tr.sectionRecipient}
        <ChevronDown className={`size-4 text-muted-foreground transition-transform duration-200 ${collapsed ? "-rotate-90" : ""}`} />
      </button>

      {!collapsed && (
        <div className="grid gap-2 border-t border-border px-4 pb-4 pt-3">
          {/* Date */}
          <div className="grid gap-1.5">
            <Label className="text-xs">{tr.date}</Label>
            <Input value={date} onChange={(e) => onDateChange(e.target.value)} placeholder={tr.datePlaceholder} />
          </div>

          {/* Recipient Name (required) */}
          <div className="grid gap-1.5">
            <Label className="text-xs">{tr.recipientName}</Label>
            <Input value={data.name} onChange={(e) => onChange({ ...data, name: e.target.value })} placeholder={tr.recipientNamePlaceholder} />
          </div>

          {/* Optional: Salutation */}
          {hasSalutation && (
            <div className="grid gap-1.5">
              <div className="flex items-center justify-between">
                <Label className="text-xs">{tr.salutation}</Label>
                <Button variant="ghost" size="icon-xs" className="cursor-pointer text-muted-foreground hover:text-destructive" onClick={removeSalutation}>
                  <Trash2 className="size-3" />
                </Button>
              </div>
              <Input
                value={data.salutation ?? ""}
                onChange={(e) => onChange({ ...data, salutation: e.target.value })}
                placeholder={tr.salutationPlaceholder}
              />
            </div>
          )}

          {/* Repeatable Address Lines */}
          {addressLines.map((line, i) => (
            <div key={line.id} className="grid gap-1.5">
              <div className="flex items-center justify-between">
                <Label className="text-xs">{tr.addressLine} {i + 1}</Label>
                <Button variant="ghost" size="icon-xs" className="cursor-pointer text-muted-foreground hover:text-destructive" onClick={() => removeAddressLine(line.id)}>
                  <Trash2 className="size-3" />
                </Button>
              </div>
              <Input
                value={line.value}
                onChange={(e) => updateAddressLine(line.id, e.target.value)}
                placeholder={tr.addressPlaceholder}
              />
            </div>
          ))}

          {/* Add field dropdown */}
          {dropdownItems.length > 0 && (
            <DropdownMenu>
              <DropdownMenuTrigger className="add-btn inline-flex h-7 cursor-pointer items-center gap-1 rounded-md px-2 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground">
                <Plus className="size-3" />
                {tr.addField}
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" sideOffset={4}>
                {dropdownItems.map((item) => (
                  <DropdownMenuItem
                    key={item.key}
                    className="cursor-pointer"
                    onClick={() => item.key === "salutation" ? addSalutation() : addAddressLine()}
                  >
                    {item.label}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      )}
    </section>
  );
}
