"use client";

import { useState } from "react";
import { Plus, Trash2, ChevronUp, ChevronDown, ChevronRight } from "lucide-react";
import type { AcademicExperienceItem, DescriptionField, ResumeLanguage } from "@/lib/types/academic-cv";
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

type OptionalFieldType = "researchGroup" | "department" | "descriptions";

const OPTIONAL_FIELD_META: Record<OptionalFieldType, { label: string; labelZh: string }> = {
  researchGroup: { label: "Research Group", labelZh: "研究组" },
  department:    { label: "Department",     labelZh: "院系" },
  descriptions:  { label: "Description",   labelZh: "描述" },
};

function emptyDesc(): DescriptionField { return { id: crypto.randomUUID(), value: "" }; }

function emptyExperience(): AcademicExperienceItem {
  return { id: crypto.randomUUID(), organization: "", role: "", location: "", startDate: "", endDate: "" };
}

interface Props {
  items: AcademicExperienceItem[];
  onChange: (items: AcademicExperienceItem[]) => void;
  language: ResumeLanguage;
  orgPlaceholder?: string;
  /** Which optional fields are available in the Add field dropdown. Defaults to all three. */
  optionalFields?: OptionalFieldType[];
}

const ALL_OPTIONAL_FIELDS: OptionalFieldType[] = ["researchGroup", "department", "descriptions"];

export function AcademicExperienceSection({
  items, onChange, language, orgPlaceholder,
  optionalFields = ALL_OPTIONAL_FIELDS,
}: Props) {
  const { lang } = useUILanguage();
  const tr = t[lang].academicCv;
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});

  function update<K extends keyof AcademicExperienceItem>(i: number, field: K, value: AcademicExperienceItem[K]) {
    onChange(items.map((item, idx) => idx === i ? { ...item, [field]: value } : item));
  }
  function add() { onChange([...items, emptyExperience()]); }
  function remove(i: number) { onChange(items.filter((_, idx) => idx !== i)); }
  function move(i: number, dir: -1 | 1) {
    const t2 = i + dir;
    if (t2 < 0 || t2 >= items.length) return;
    const next = [...items];
    [next[i], next[t2]] = [next[t2], next[i]];
    onChange(next);
  }

  function addOptionalField(i: number, type: OptionalFieldType) {
    if (type === "descriptions") {
      // Non-unique: each click appends one bullet
      update(i, "descriptions", [...(items[i].descriptions ?? []), emptyDesc()]);
    } else if (type === "researchGroup") {
      update(i, "researchGroup", "");
    } else {
      update(i, "department", "");
    }
  }

  function removeUniqueField(i: number, type: "researchGroup" | "department") {
    const next = { ...items[i] };
    delete next[type];
    onChange(items.map((item, idx) => idx === i ? next : item));
  }

  function removeDesc(i: number, di: number) {
    const descs = items[i].descriptions ?? [];
    const next = descs.filter((_, idx) => idx !== di);
    if (next.length === 0) {
      // Last bullet removed — clear the whole descriptions field
      const nextItem = { ...items[i] };
      delete nextItem.descriptions;
      onChange(items.map((item, idx) => idx === i ? nextItem : item));
    } else {
      update(i, "descriptions", next);
    }
  }

  function updateDesc(i: number, di: number, value: string) {
    const descs = (items[i].descriptions ?? []).map((d, idx) => idx === di ? { ...d, value } : d);
    update(i, "descriptions", descs);
  }

  function moveDesc(i: number, di: number, dir: "up" | "down") {
    const descs = [...(items[i].descriptions ?? [])];
    const target = dir === "up" ? di - 1 : di + 1;
    if (target < 0 || target >= descs.length) return;
    [descs[di], descs[target]] = [descs[target], descs[di]];
    update(i, "descriptions", descs);
  }

  return (
    <div className="space-y-3">
      <Button variant="ghost" size="xs" className="add-btn cursor-pointer gap-1 text-xs" onClick={add}>
        <Plus className="size-3" /> {tr.addEntry}
      </Button>
      {items.map((item, i) => {
        const isCollapsed = collapsed[item.id] ?? true;
        const header = [item.organization, item.role].filter(Boolean).join(" · ") || `Entry #${i + 1}`;
        const zh = language === "zh";

        // Unique fields are only available if not yet set; descriptions always available
        const addableFields = optionalFields.filter((type) => {
          if (type === "researchGroup") return item.researchGroup === undefined;
          if (type === "department") return item.department === undefined;
          return true; // descriptions: always addable
        });

        return (
          <div key={item.id} className="entry-card rounded-lg border border-border">
            <div className="entry-header flex items-stretch justify-between px-3">
              <button
                type="button"
                className="flex flex-1 cursor-pointer items-center gap-1.5 py-2.5 text-xs font-medium"
                onClick={() => setCollapsed(prev => ({ ...prev, [item.id]: !prev[item.id] }))}
              >
                <ChevronRight className={`size-3.5 text-muted-foreground transition-transform duration-150 ${isCollapsed ? "" : "rotate-90"}`} />
                <span className="truncate">{header}</span>
              </button>
              <div className="flex items-center gap-0.5">
                <Button variant="ghost" size="icon-xs" className="cursor-pointer text-muted-foreground hover:text-foreground disabled:opacity-30" disabled={i === 0} onClick={() => move(i, -1)}><ChevronUp className="size-3" /></Button>
                <Button variant="ghost" size="icon-xs" className="cursor-pointer text-muted-foreground hover:text-foreground disabled:opacity-30" disabled={i === items.length - 1} onClick={() => move(i, 1)}><ChevronDown className="size-3" /></Button>
                <Button variant="ghost" size="icon-xs" className="cursor-pointer text-muted-foreground hover:text-destructive" onClick={() => remove(i)}><Trash2 className="size-3" /></Button>
              </div>
            </div>

            {!isCollapsed && (
              <div className="grid gap-2 border-t border-border px-3 pb-3 pt-2.5">
                {/* Fixed fields */}
                <div className="grid gap-1.5">
                  <Label className="text-xs">{tr.organization}</Label>
                  <Input value={item.organization} onChange={e => update(i, "organization", e.target.value)} placeholder={orgPlaceholder ?? (zh ? "中国科学院" : "Imperial College London")} />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="grid gap-1.5">
                    <Label className="text-xs">{tr.role}</Label>
                    <Input value={item.role} onChange={e => update(i, "role", e.target.value)} placeholder={zh ? "研究助理" : "Research Assistant"} />
                  </div>
                  <div className="grid gap-1.5">
                    <Label className="text-xs">{zh ? "地点" : "Location"}</Label>
                    <Input value={item.location} onChange={e => update(i, "location", e.target.value)} placeholder={zh ? "北京, 中国" : "London, UK"} />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="grid gap-1.5">
                    <Label className="text-xs">{zh ? "开始" : "Start"}</Label>
                    <Input value={item.startDate} onChange={e => update(i, "startDate", e.target.value)} placeholder={defaultDate(language, -2)} />
                  </div>
                  <div className="grid gap-1.5">
                    <Label className="text-xs">{zh ? "结束" : "End"}</Label>
                    <Input value={item.endDate} onChange={e => update(i, "endDate", e.target.value)} placeholder={defaultDate(language)} />
                  </div>
                </div>

                {/* Optional: Research Group */}
                {item.researchGroup !== undefined && (
                  <div className="grid gap-1.5">
                    <div className="flex items-center justify-between">
                      <Label className="text-xs">{zh ? OPTIONAL_FIELD_META.researchGroup.labelZh : OPTIONAL_FIELD_META.researchGroup.label}</Label>
                      <Button variant="ghost" size="icon-xs" className="cursor-pointer text-muted-foreground hover:text-destructive" onClick={() => removeUniqueField(i, "researchGroup")}><Trash2 className="size-3" /></Button>
                    </div>
                    <Input value={item.researchGroup} onChange={e => update(i, "researchGroup", e.target.value)} placeholder={zh ? "机器学习组" : "ML Group"} />
                  </div>
                )}

                {/* Optional: Department */}
                {item.department !== undefined && (
                  <div className="grid gap-1.5">
                    <div className="flex items-center justify-between">
                      <Label className="text-xs">{zh ? OPTIONAL_FIELD_META.department.labelZh : OPTIONAL_FIELD_META.department.label}</Label>
                      <Button variant="ghost" size="icon-xs" className="cursor-pointer text-muted-foreground hover:text-destructive" onClick={() => removeUniqueField(i, "department")}><Trash2 className="size-3" /></Button>
                    </div>
                    <Input value={item.department} onChange={e => update(i, "department", e.target.value)} placeholder={zh ? "计算机系" : "EECS"} />
                  </div>
                )}

                {/* Optional: Descriptions — each bullet is individually trashable */}
                {(item.descriptions ?? []).length > 0 && (
                  <div className="grid gap-1.5">
                    <Label className="text-xs">{zh ? OPTIONAL_FIELD_META.descriptions.labelZh : OPTIONAL_FIELD_META.descriptions.label}</Label>
                    {item.descriptions!.map((desc, di) => (
                      <div key={desc.id} className="flex items-center gap-1">
                        <div className="flex flex-col gap-0.5">
                          <Button
                            variant="ghost" size="icon-xs"
                            className="cursor-pointer text-muted-foreground hover:text-foreground disabled:opacity-30"
                            disabled={di === 0}
                            onClick={() => moveDesc(i, di, "up")}
                          ><ChevronUp className="size-3" /></Button>
                          <Button
                            variant="ghost" size="icon-xs"
                            className="cursor-pointer text-muted-foreground hover:text-foreground disabled:opacity-30"
                            disabled={di === item.descriptions!.length - 1}
                            onClick={() => moveDesc(i, di, "down")}
                          ><ChevronDown className="size-3" /></Button>
                        </div>
                        <Input
                          value={desc.value}
                          onChange={e => updateDesc(i, di, e.target.value)}
                          placeholder={zh ? "描述一项职责或成就…" : "Describe a responsibility or achievement…"}
                          className="flex-1"
                        />
                        <Button
                          variant="ghost" size="icon-xs"
                          className="shrink-0 cursor-pointer text-muted-foreground hover:text-destructive"
                          onClick={() => removeDesc(i, di)}
                        ><Trash2 className="size-3" /></Button>
                      </div>
                    ))}
                  </div>
                )}

                {/* Add optional field */}
                {addableFields.length > 0 && (
                  <DropdownMenu>
                    <DropdownMenuTrigger className="add-btn inline-flex h-7 cursor-pointer items-center gap-1 rounded-md px-2 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground">
                      <Plus className="size-3" />
                      {zh ? "添加字段" : "Add field"}
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="start" sideOffset={4}>
                      {addableFields.map((type) => (
                        <DropdownMenuItem key={type} className="cursor-pointer" onClick={() => addOptionalField(i, type)}>
                          {zh ? OPTIONAL_FIELD_META[type].labelZh : OPTIONAL_FIELD_META[type].label}
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
