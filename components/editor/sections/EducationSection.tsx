"use client";

import { useState } from "react";
import { Plus, Trash2, ChevronUp, ChevronDown, ChevronRight } from "lucide-react";
import type { EducationItem, EducationExtraField, EducationExtraFieldType } from "@/lib/types/resume";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";

const EXTRA_FIELD_META: Record<EducationExtraFieldType, { label: string; unique: boolean }> = {
  grade:  { label: "Grade",  unique: true },
  awards: { label: "Awards", unique: true },
  custom: { label: "Custom Field", unique: false },
};

interface EducationSectionProps {
  items: EducationItem[];
  onChange: (items: EducationItem[]) => void;
}

function emptyEducation(): EducationItem {
  return {
    id: crypto.randomUUID(),
    institution: "",
    degree: "",
    field: "",
    location: "",
    startDate: "",
    endDate: "",
    extraFields: [],
  };
}

export function EducationSection({ items, onChange }: EducationSectionProps) {
  function update(index: number, field: keyof EducationItem, value: string) {
    const next = items.map((item, i) => (i === index ? { ...item, [field]: value } : item));
    onChange(next);
  }

  function add() {
    onChange([...items, emptyEducation()]);
  }

  function remove(index: number) {
    onChange(items.filter((_, i) => i !== index));
  }

  function move(index: number, direction: -1 | 1) {
    const target = index + direction;
    if (target < 0 || target >= items.length) return;
    const next = [...items];
    [next[index], next[target]] = [next[target], next[index]];
    onChange(next);
  }

  function updateExtraFields(index: number, extraFields: EducationExtraField[]) {
    const next = items.map((item, i) => (i === index ? { ...item, extraFields } : item));
    onChange(next);
  }

  return (
    <div>
      <div className="space-y-4">
        <Button variant="ghost" size="xs" className="cursor-pointer gap-1 text-xs" onClick={add}>
          <Plus className="size-3" /> Add Entry
        </Button>
        {items.map((edu, i) => (
          <EducationBlock
            key={edu.id}
            edu={edu}
            index={i}
            isFirst={i === 0}
            isLast={i === items.length - 1}
            onUpdate={(field, value) => update(i, field, value)}
            onRemove={() => remove(i)}
            onMoveUp={() => move(i, -1)}
            onMoveDown={() => move(i, 1)}
            onExtraFieldsChange={(fields) => updateExtraFields(i, fields)}
          />
        ))}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Education block — one education entry                              */
/* ------------------------------------------------------------------ */

function EducationBlock({
  edu,
  index,
  isFirst,
  isLast,
  onUpdate,
  onRemove,
  onMoveUp,
  onMoveDown,
  onExtraFieldsChange,
}: {
  edu: EducationItem;
  index: number;
  isFirst: boolean;
  isLast: boolean;
  onUpdate: (field: keyof EducationItem, value: string) => void;
  onRemove: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onExtraFieldsChange: (fields: EducationExtraField[]) => void;
}) {
  const [collapsed, setCollapsed] = useState(false);
  const extraFields = edu.extraFields ?? [];

  // Filter out unique types already added
  const addableTypes = (Object.keys(EXTRA_FIELD_META) as EducationExtraFieldType[]).filter((type) => {
    const meta = EXTRA_FIELD_META[type];
    if (!meta.unique) return true;
    return !extraFields.some((f) => f.type === type);
  });

  function addExtraField(type: EducationExtraFieldType) {
    const meta = EXTRA_FIELD_META[type];
    const field: EducationExtraField = {
      id: crypto.randomUUID(),
      type,
      label: type === "custom" ? "" : meta.label,
      value: "",
    };
    onExtraFieldsChange([...extraFields, field]);
  }

  function updateExtraField(id: string, patch: Partial<EducationExtraField>) {
    onExtraFieldsChange(extraFields.map((f) => (f.id === id ? { ...f, ...patch } : f)));
  }

  function removeExtraField(id: string) {
    onExtraFieldsChange(extraFields.filter((f) => f.id !== id));
  }

  return (
    <div className="rounded-lg border border-border">
      {/* Block header — clickable to collapse, always visible */}
      <div className="flex items-center justify-between px-3 py-2">
        <button
          type="button"
          className="flex flex-1 cursor-pointer items-center gap-1 text-left"
          onClick={() => setCollapsed(!collapsed)}
        >
          <ChevronRight className={`size-3 text-muted-foreground transition-transform ${collapsed ? "" : "rotate-90"}`} />
          <span className="text-xs font-medium">
            {edu.institution || `Entry #${index + 1}`}
          </span>
        </button>
        <div className="flex items-center gap-0.5">
          <Button
            variant="ghost" size="icon-xs"
            className="cursor-pointer text-muted-foreground hover:text-foreground disabled:opacity-30"
            disabled={isFirst} onClick={onMoveUp}
          >
            <ChevronUp className="size-3" />
          </Button>
          <Button
            variant="ghost" size="icon-xs"
            className="cursor-pointer text-muted-foreground hover:text-foreground disabled:opacity-30"
            disabled={isLast} onClick={onMoveDown}
          >
            <ChevronDown className="size-3" />
          </Button>
          <Button variant="ghost" size="icon-xs" className="cursor-pointer text-destructive hover:bg-destructive/10" onClick={onRemove}>
            <Trash2 className="size-3" />
          </Button>
        </div>
      </div>

      {/* Collapsible content */}
      {!collapsed && (
      <div className="border-t border-border px-3 pb-3 pt-2">
      {/* Fixed fields */}
      <div className="grid grid-cols-2 gap-x-3 gap-y-2">
        <div className="col-span-2 flex flex-col gap-1">
          <Label className="text-xs">Institution</Label>
          <Input value={edu.institution} onChange={(e) => onUpdate("institution", e.target.value)} placeholder="University of..." />
        </div>
        <div className="flex flex-col gap-1">
          <Label className="text-xs">Degree</Label>
          <Input value={edu.degree} onChange={(e) => onUpdate("degree", e.target.value)} placeholder="BSc / MSc / PhD" />
        </div>
        <div className="flex flex-col gap-1">
          <Label className="text-xs">Field of Study</Label>
          <Input value={edu.field} onChange={(e) => onUpdate("field", e.target.value)} placeholder="Computer Science" />
        </div>
        <div className="flex flex-col gap-1">
          <Label className="text-xs">Location</Label>
          <Input value={edu.location} onChange={(e) => onUpdate("location", e.target.value)} placeholder="London, UK" />
        </div>
        <div className="flex flex-col gap-1">
          <Label className="text-xs">Start Date</Label>
          <Input value={edu.startDate} onChange={(e) => onUpdate("startDate", e.target.value)} placeholder="Sep 2021" />
        </div>
        <div className="flex flex-col gap-1">
          <Label className="text-xs">End Date</Label>
          <Input value={edu.endDate} onChange={(e) => onUpdate("endDate", e.target.value)} placeholder="Jun 2025" />
        </div>
      </div>

      {/* Dynamic extra fields */}
      {extraFields.length > 0 && (
        <div className="mt-3 space-y-2">
          {extraFields.map((ef) => (
            <div key={ef.id} className="flex items-end gap-2">
              {ef.type === "custom" ? (
                <div className="grid flex-1 grid-cols-[120px_1fr] gap-2">
                  <div className="flex flex-col gap-1">
                    <Label className="text-xs">Field Name</Label>
                    <Input value={ef.label} onChange={(e) => updateExtraField(ef.id, { label: e.target.value })} placeholder="Coursework" />
                  </div>
                  <div className="flex flex-col gap-1">
                    <Label className="text-xs">Value</Label>
                    <Input value={ef.value} onChange={(e) => updateExtraField(ef.id, { value: e.target.value })} placeholder="Describe..." />
                  </div>
                </div>
              ) : (
                <div className="flex flex-1 flex-col gap-1">
                  <Label className="text-xs">{EXTRA_FIELD_META[ef.type].label}</Label>
                  <Input
                    value={ef.value}
                    onChange={(e) => updateExtraField(ef.id, { value: e.target.value })}
                    placeholder={ef.type === "grade" ? "First Class Honours / 3.8/4.0" : "Dean's List, Outstanding Student Scholarship"}
                  />
                </div>
              )}
              <Button
                variant="ghost" size="icon-xs"
                className="mb-0.5 cursor-pointer text-muted-foreground hover:text-destructive"
                onClick={() => removeExtraField(ef.id)}
              >
                <Trash2 className="size-3" />
              </Button>
            </div>
          ))}
        </div>
      )}

      {/* Add extra field dropdown */}
      {addableTypes.length > 0 && (
        <div className="mt-2">
          <DropdownMenu>
            <DropdownMenuTrigger className="inline-flex h-7 cursor-pointer items-center gap-1 rounded-md px-2 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground">
              <Plus className="size-3" />
              Add field
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" sideOffset={4}>
              {addableTypes.map((type) => (
                <DropdownMenuItem
                  key={type}
                  className="cursor-pointer"
                  onClick={() => addExtraField(type)}
                >
                  {EXTRA_FIELD_META[type].label}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      )}
      </div>
      )}
    </div>
  );
}
