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

type OptionalFieldType = "salutation" | "department" | "institution" | "addressLine1" | "addressLine2";

interface FieldMeta { label: string; placeholder: string }

const OPTIONAL_FIELD_META: Record<OptionalFieldType, FieldMeta> = {
  salutation:   { label: "Salutation (Dear…)",    placeholder: "Professor Jane Smith" },
  department:   { label: "Department",             placeholder: "Department of Mechanical Engineering" },
  institution:  { label: "Institution",            placeholder: "University of XXX" },
  addressLine1: { label: "Address Line 1",         placeholder: "000 University Ave" },
  addressLine2: { label: "City, State Zip",        placeholder: "Cambridge, MA 02139" },
};

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

  const addableFields = (Object.keys(OPTIONAL_FIELD_META) as OptionalFieldType[]).filter(
    (f) => data[f] === undefined,
  );

  function update<K extends keyof CoverLetterRecipient>(field: K, value: CoverLetterRecipient[K]) {
    onChange({ ...data, [field]: value });
  }

  function addField(field: OptionalFieldType) {
    onChange({ ...data, [field]: "" });
  }

  function removeField(field: OptionalFieldType) {
    const next = { ...data } as CoverLetterRecipient;
    delete next[field];
    onChange(next);
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
            <Input value={date} onChange={(e) => onDateChange(e.target.value)} placeholder="August 25, 2024" />
          </div>

          {/* Recipient Name (required) */}
          <div className="grid gap-1.5">
            <Label className="text-xs">{tr.recipientName}</Label>
            <Input value={data.name} onChange={(e) => update("name", e.target.value)} placeholder="Search Committee / Prof. Jane Smith" />
          </div>

          {/* Optional fields */}
          {(Object.keys(OPTIONAL_FIELD_META) as OptionalFieldType[]).map((field) => {
            if (data[field] === undefined) return null;
            const meta = OPTIONAL_FIELD_META[field];
            return (
              <div key={field} className="grid gap-1.5">
                <div className="flex items-center justify-between">
                  <Label className="text-xs">{meta.label}</Label>
                  <Button
                    variant="ghost" size="icon-xs"
                    className="cursor-pointer text-muted-foreground hover:text-destructive"
                    onClick={() => removeField(field)}
                  >
                    <Trash2 className="size-3" />
                  </Button>
                </div>
                <Input
                  value={data[field] as string}
                  onChange={(e) => update(field, e.target.value)}
                  placeholder={meta.placeholder}
                />
              </div>
            );
          })}

          {/* Add optional field */}
          {addableFields.length > 0 && (
            <DropdownMenu>
              <DropdownMenuTrigger className="add-btn inline-flex h-7 cursor-pointer items-center gap-1 rounded-md px-2 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground">
                <Plus className="size-3" />
                {tr.addField}
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" sideOffset={4}>
                {addableFields.map((field) => (
                  <DropdownMenuItem key={field} className="cursor-pointer" onClick={() => addField(field)}>
                    {OPTIONAL_FIELD_META[field].label}
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
