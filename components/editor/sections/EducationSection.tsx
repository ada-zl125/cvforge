"use client";

import { useState } from "react";
import { Plus, Trash2, ChevronUp, ChevronDown, ChevronRight } from "lucide-react";
import type { EducationItem, EducationExtraField, EducationExtraFieldType, ResumeLanguage } from "@/lib/types/resume";
import { defaultDate } from "@/lib/defaults";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";

const EXTRA_FIELD_META: Record<EducationExtraFieldType, { label: string; labelZh: string; unique: boolean }> = {
  grade:  { label: "Grade",        labelZh: "成绩",    unique: true },
  awards: { label: "Awards",       labelZh: "获奖",    unique: true },
  custom: { label: "Custom Field", labelZh: "自定义字段", unique: false },
};


interface EducationSectionProps {
  items: EducationItem[];
  onChange: (items: EducationItem[]) => void;
  language: ResumeLanguage;
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

export function EducationSection({ items, onChange, language }: EducationSectionProps) {
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
        <Button variant="ghost" size="xs" className="add-btn cursor-pointer gap-1 text-xs" onClick={add}>
          <Plus className="size-3" /> {language === "zh" ? "添加条目" : "Add Entry"}
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
            language={language}
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
  language,
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
  language: ResumeLanguage;
}) {
  const [collapsed, setCollapsed] = useState(false);
  const extraFields = edu.extraFields ?? [];
  const zh = language === "zh";

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
      label: type === "custom" ? "" : (zh ? meta.labelZh : meta.label),
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
    <div className="entry-card rounded-lg border border-border">
      {/* Block header — clickable to collapse, always visible */}
      <div className="entry-header flex items-stretch justify-between px-3">
        <button
          type="button"
          className="flex flex-1 cursor-pointer items-center gap-1 py-2 text-left"
          onClick={() => setCollapsed(!collapsed)}
        >
          <ChevronRight className={`size-3 text-muted-foreground transition-transform duration-200 ${collapsed ? "" : "rotate-90"}`} />
          <span className="text-xs font-medium">
            {edu.institution || `${zh ? "条目" : "Entry"} #${index + 1}`}
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
      <div className="grid gap-2">
        <div className="grid gap-1.5">
          <Label className="text-xs">{zh ? "学校" : "Institution"}</Label>
          <Input value={edu.institution} onChange={(e) => onUpdate("institution", e.target.value)} placeholder={zh ? "你的学校" : "University of..."} />
        </div>
        <div className="grid gap-1.5">
          <Label className="text-xs">{zh ? "学位与专业" : "Degree and Field of Study"}</Label>
          <Input value={edu.degree} onChange={(e) => onUpdate("degree", e.target.value)} placeholder={zh ? "计算机科学理学硕士" : "MSc in Computer Science"} />
        </div>
        <div className="grid grid-cols-3 gap-2">
          <div className="grid gap-1.5">
            <Label className="text-xs">{zh ? "地点" : "Location"}</Label>
            <Input value={edu.location} onChange={(e) => onUpdate("location", e.target.value)} placeholder={zh ? "中国, 北京" : "London, UK"} />
          </div>
          <div className="grid gap-1.5">
            <Label className="text-xs">{zh ? "开始" : "Start"}</Label>
            <Input value={edu.startDate} onChange={(e) => onUpdate("startDate", e.target.value)} placeholder={defaultDate(language, -4)} />
          </div>
          <div className="grid gap-1.5">
            <Label className="text-xs">{zh ? "结束" : "End"}</Label>
            <Input value={edu.endDate} onChange={(e) => onUpdate("endDate", e.target.value)} placeholder={defaultDate(language)} />
          </div>
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
                    <Label className="text-xs">{zh ? "字段名称" : "Field Name"}</Label>
                    <Input value={ef.label} onChange={(e) => updateExtraField(ef.id, { label: e.target.value })} placeholder={zh ? "活动" : "Activities"} />
                  </div>
                  <div className="flex flex-col gap-1">
                    <Label className="text-xs">{zh ? "内容" : "Value"}</Label>
                    <Input value={ef.value} onChange={(e) => updateExtraField(ef.id, { value: e.target.value })} placeholder={zh ? "描述" : "Description"} />
                  </div>
                </div>
              ) : (
                <div className="flex flex-1 flex-col gap-1">
                  <Label className="text-xs">{zh ? EXTRA_FIELD_META[ef.type].labelZh : EXTRA_FIELD_META[ef.type].label}</Label>
                  <Input
                    value={ef.value}
                    onChange={(e) => updateExtraField(ef.id, { value: e.target.value })}
                    placeholder={
                      ef.type === "grade"
                        ? zh ? "93.53/100" : "Distinction, 75.53/100"
                        : zh ? "国家奖学金, 校优秀学生奖学金, 校优秀毕业生" : "Dean's List, Outstanding Student Scholarship"
                    }
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
            <DropdownMenuTrigger className="add-btn inline-flex h-7 cursor-pointer items-center gap-1 rounded-md px-2 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground">
              <Plus className="size-3" />
              {zh ? "添加字段" : "Add field"}
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" sideOffset={4}>
              {addableTypes.map((type) => (
                <DropdownMenuItem
                  key={type}
                  className="cursor-pointer"
                  onClick={() => addExtraField(type)}
                >
                  {zh ? EXTRA_FIELD_META[type].labelZh : EXTRA_FIELD_META[type].label}
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
