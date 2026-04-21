"use client";

import { useState } from "react";
import { Plus, Trash2, ChevronUp, ChevronDown, ChevronRight } from "lucide-react";
import type {
  AcademicEducationItem,
  AcademicEducationExtraField,
  AcademicEducationExtraFieldType,
  ResumeLanguage,
} from "@/lib/types/academic-cv";
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
import { useUILanguage } from "@/lib/ui-language";
import { t } from "@/lib/translations";

const EXTRA_FIELD_META: Record<AcademicEducationExtraFieldType, { label: string; labelZh: string; unique: boolean }> = {
  grade:         { label: "Grade",          labelZh: "成绩",    unique: true  },
  researchField: { label: "Research Field", labelZh: "研究方向", unique: true  },
  awards:        { label: "Awards",         labelZh: "获奖情况", unique: true  },
  custom:        { label: "Custom Field",   labelZh: "自定义字段", unique: false },
};

function emptyEducation(): AcademicEducationItem {
  return {
    id: crypto.randomUUID(),
    institution: "", degree: "", field: "",
    location: "", startDate: "", endDate: "",
    extraFields: [],
  };
}

interface Props {
  items: AcademicEducationItem[];
  onChange: (items: AcademicEducationItem[]) => void;
  language: ResumeLanguage;
}

export function AcademicEducationSection({ items, onChange, language }: Props) {
  const { lang } = useUILanguage();
  const tr = t[lang].academicCv;

  function add() { onChange([...items, emptyEducation()]); }
  function remove(i: number) { onChange(items.filter((_, idx) => idx !== i)); }
  function move(i: number, dir: -1 | 1) {
    const t2 = i + dir;
    if (t2 < 0 || t2 >= items.length) return;
    const next = [...items];
    [next[i], next[t2]] = [next[t2], next[i]];
    onChange(next);
  }
  function updateItem<K extends keyof AcademicEducationItem>(i: number, field: K, value: AcademicEducationItem[K]) {
    onChange(items.map((item, idx) => idx === i ? { ...item, [field]: value } : item));
  }
  function updateExtraFields(i: number, extraFields: AcademicEducationExtraField[]) {
    onChange(items.map((item, idx) => idx === i ? { ...item, extraFields } : item));
  }

  return (
    <div className="space-y-3">
      <Button variant="ghost" size="xs" className="add-btn cursor-pointer gap-1 text-xs" onClick={add}>
        <Plus className="size-3" /> {tr.addEntry}
      </Button>
      {items.map((item, i) => (
        <EducationBlock
          key={item.id}
          item={item}
          index={i}
          isFirst={i === 0}
          isLast={i === items.length - 1}
          language={language}
          onUpdate={(field, value) => updateItem(i, field, value)}
          onRemove={() => remove(i)}
          onMoveUp={() => move(i, -1)}
          onMoveDown={() => move(i, 1)}
          onExtraFieldsChange={(fields) => updateExtraFields(i, fields)}
        />
      ))}
    </div>
  );
}

function EducationBlock({
  item,
  index,
  isFirst,
  isLast,
  language,
  onUpdate,
  onRemove,
  onMoveUp,
  onMoveDown,
  onExtraFieldsChange,
}: {
  item: AcademicEducationItem;
  index: number;
  isFirst: boolean;
  isLast: boolean;
  language: ResumeLanguage;
  onUpdate: (field: keyof AcademicEducationItem, value: string) => void;
  onRemove: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onExtraFieldsChange: (fields: AcademicEducationExtraField[]) => void;
}) {
  const [collapsed, setCollapsed] = useState(true);
  const zh = language === "zh";
  const extraFields = item.extraFields ?? [];

  const addableTypes = (Object.keys(EXTRA_FIELD_META) as AcademicEducationExtraFieldType[]).filter((type) => {
    if (!EXTRA_FIELD_META[type].unique) return true;
    return !extraFields.some((f) => f.type === type);
  });

  function addExtraField(type: AcademicEducationExtraFieldType) {
    const meta = EXTRA_FIELD_META[type];
    const field: AcademicEducationExtraField = {
      id: crypto.randomUUID(),
      type,
      label: type === "custom" ? "" : (zh ? meta.labelZh : meta.label),
      value: "",
    };
    onExtraFieldsChange([...extraFields, field]);
  }

  function updateExtraField(id: string, patch: Partial<AcademicEducationExtraField>) {
    onExtraFieldsChange(extraFields.map((f) => f.id === id ? { ...f, ...patch } : f));
  }

  function removeExtraField(id: string) {
    onExtraFieldsChange(extraFields.filter((f) => f.id !== id));
  }

  return (
    <div className="entry-card rounded-lg border border-border">
      <div className="entry-header flex items-stretch justify-between px-3">
        <button
          type="button"
          className="flex flex-1 cursor-pointer items-center gap-1.5 py-2.5 text-xs font-medium"
          onClick={() => setCollapsed(!collapsed)}
        >
          <ChevronRight className={`size-3.5 text-muted-foreground transition-transform duration-150 ${collapsed ? "" : "rotate-90"}`} />
          <span className="truncate">{item.institution || `${zh ? "条目" : "Entry"} #${index + 1}`}</span>
        </button>
        <div className="flex items-center gap-0.5">
          <Button variant="ghost" size="icon-xs" className="cursor-pointer text-muted-foreground hover:text-foreground disabled:opacity-30" disabled={isFirst} onClick={onMoveUp}><ChevronUp className="size-3" /></Button>
          <Button variant="ghost" size="icon-xs" className="cursor-pointer text-muted-foreground hover:text-foreground disabled:opacity-30" disabled={isLast} onClick={onMoveDown}><ChevronDown className="size-3" /></Button>
          <Button variant="ghost" size="icon-xs" className="cursor-pointer text-muted-foreground hover:text-destructive" onClick={onRemove}><Trash2 className="size-3" /></Button>
        </div>
      </div>

      {!collapsed && (
        <div className="border-t border-border px-3 pb-3 pt-2.5">
          {/* Fixed fields */}
          <div className="grid gap-2">
            <div className="grid gap-1.5">
              <Label className="text-xs">{zh ? "学校" : "Institution"}</Label>
              <Input value={item.institution} onChange={e => onUpdate("institution", e.target.value)} placeholder={zh ? "北京大学" : "Imperial College London"} />
            </div>
            <div className="grid gap-1.5">
              <Label className="text-xs">{zh ? "学位与专业" : "Degree and Field of Study"}</Label>
              <Input value={item.degree} onChange={e => onUpdate("degree", e.target.value)} placeholder={zh ? "计算机科学理学硕士" : "PhD in Computer Science"} />
            </div>
            <div className="grid grid-cols-3 gap-2">
              <div className="grid gap-1.5">
                <Label className="text-xs">{zh ? "地点" : "Location"}</Label>
                <Input value={item.location} onChange={e => onUpdate("location", e.target.value)} placeholder={zh ? "北京, 中国" : "London, UK"} />
              </div>
              <div className="grid gap-1.5">
                <Label className="text-xs">{zh ? "开始" : "Start"}</Label>
                <Input value={item.startDate} onChange={e => onUpdate("startDate", e.target.value)} placeholder={defaultDate(language, -4)} />
              </div>
              <div className="grid gap-1.5">
                <Label className="text-xs">{zh ? "结束" : "End"}</Label>
                <Input value={item.endDate} onChange={e => onUpdate("endDate", e.target.value)} placeholder={defaultDate(language)} />
              </div>
            </div>
          </div>

          {/* Extra fields */}
          {extraFields.length > 0 && (
            <div className="mt-3 space-y-2">
              {extraFields.map((ef) => (
                <div key={ef.id} className="flex items-end gap-2">
                  {ef.type === "custom" ? (
                    <div className="grid flex-1 grid-cols-[120px_1fr] gap-2">
                      <div className="flex flex-col gap-1">
                        <Label className="text-xs">{zh ? "字段名称" : "Field Name"}</Label>
                        <Input value={ef.label} onChange={e => updateExtraField(ef.id, { label: e.target.value })} placeholder={zh ? "课程作业" : "Coursework"} />
                      </div>
                      <div className="flex flex-col gap-1">
                        <Label className="text-xs">{zh ? "内容" : "Value"}</Label>
                        <Input value={ef.value} onChange={e => updateExtraField(ef.id, { value: e.target.value })} placeholder={zh ? "描述..." : "Describe..."} />
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-1 flex-col gap-1">
                      <Label className="text-xs">{zh ? EXTRA_FIELD_META[ef.type].labelZh : EXTRA_FIELD_META[ef.type].label}</Label>
                      <Input
                        value={ef.value}
                        onChange={e => updateExtraField(ef.id, { value: e.target.value })}
                        placeholder={
                          ef.type === "grade"
                            ? (zh ? "一等荣誉 / 3.8/4.0" : "First Class Honours / 3.8/4.0")
                            : ef.type === "researchField"
                            ? (zh ? "机器学习、自然语言处理" : "Machine Learning, NLP")
                            : (zh ? "院长名单、优秀学生奖学金" : "Dean's List, Outstanding Student Scholarship")
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

          {/* Add field dropdown */}
          {addableTypes.length > 0 && (
            <div className="mt-2">
              <DropdownMenu>
                <DropdownMenuTrigger className="add-btn inline-flex h-7 cursor-pointer items-center gap-1 rounded-md px-2 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground">
                  <Plus className="size-3" />
                  {zh ? "添加字段" : "Add field"}
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" sideOffset={4}>
                  {addableTypes.map((type) => (
                    <DropdownMenuItem key={type} className="cursor-pointer" onClick={() => addExtraField(type)}>
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
