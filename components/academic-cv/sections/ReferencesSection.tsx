"use client";

import { useState } from "react";
import { Plus, Trash2, ChevronUp, ChevronDown, ChevronRight } from "lucide-react";
import type { ReferenceItem, ResumeLanguage } from "@/lib/types/academic-cv";
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

type OptionalFieldType = "title" | "relationship" | "address" | "phone" | "email";

const OPTIONAL_FIELD_META: Record<OptionalFieldType, { label: string; labelZh: string }> = {
  title:        { label: "Title / Position",  labelZh: "职称" },
  relationship: { label: "Relationship",      labelZh: "关系" },
  address:      { label: "Address",           labelZh: "地址" },
  phone:        { label: "Phone",             labelZh: "电话" },
  email:        { label: "Email",             labelZh: "邮箱" },
};

function emptyReference(): ReferenceItem {
  return { id: crypto.randomUUID(), name: "" };
}

interface Props {
  items: ReferenceItem[];
  onChange: (items: ReferenceItem[]) => void;
  language: ResumeLanguage;
}

export function ReferencesSection({ items, onChange, language }: Props) {
  const { lang } = useUILanguage();
  const tr = t[lang].academicCv;
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});

  function update<K extends keyof ReferenceItem>(i: number, field: K, value: ReferenceItem[K]) {
    onChange(items.map((item, idx) => idx === i ? { ...item, [field]: value } : item));
  }
  function add() { onChange([...items, emptyReference()]); }
  function remove(i: number) { onChange(items.filter((_, idx) => idx !== i)); }
  function move(i: number, dir: -1 | 1) {
    const t2 = i + dir;
    if (t2 < 0 || t2 >= items.length) return;
    const next = [...items];
    [next[i], next[t2]] = [next[t2], next[i]];
    onChange(next);
  }

  function addOptionalField(i: number, type: OptionalFieldType) {
    update(i, type, "");
  }

  function removeOptionalField(i: number, type: OptionalFieldType) {
    const next = { ...items[i] } as ReferenceItem;
    delete next[type];
    onChange(items.map((item, idx) => idx === i ? next : item));
  }

  return (
    <div className="space-y-3">
      <Button variant="ghost" size="xs" className="add-btn cursor-pointer gap-1 text-xs" onClick={add}>
        <Plus className="size-3" /> {tr.addEntry}
      </Button>
      {items.map((item, i) => {
        const isCollapsed = collapsed[item.id] ?? true;
        const header = item.name || `Entry #${i + 1}`;
        const zh = language === "zh";

        const addableFields = (Object.keys(OPTIONAL_FIELD_META) as OptionalFieldType[]).filter(
          (type) => item[type] === undefined
        );

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
                {/* Fixed: Name */}
                <div className="grid gap-1.5">
                  <Label className="text-xs">{zh ? "姓名" : "Name"}</Label>
                  <Input value={item.name} onChange={e => update(i, "name", e.target.value)} placeholder={zh ? "推荐人姓名" : "Referee Name"} />
                </div>

                {/* Optional: Title */}
                {item.title !== undefined && (
                  <div className="grid gap-1.5">
                    <div className="flex items-center justify-between">
                      <Label className="text-xs">{zh ? OPTIONAL_FIELD_META.title.labelZh : OPTIONAL_FIELD_META.title.label}</Label>
                      <Button variant="ghost" size="icon-xs" className="cursor-pointer text-muted-foreground hover:text-destructive" onClick={() => removeOptionalField(i, "title")}><Trash2 className="size-3" /></Button>
                    </div>
                    <Input value={item.title} onChange={e => update(i, "title", e.target.value)} placeholder={zh ? "高级研究员" : "Senior Scientist"} />
                  </div>
                )}

                {/* Optional: Relationship */}
                {item.relationship !== undefined && (
                  <div className="grid gap-1.5">
                    <div className="flex items-center justify-between">
                      <Label className="text-xs">{zh ? OPTIONAL_FIELD_META.relationship.labelZh : OPTIONAL_FIELD_META.relationship.label}</Label>
                      <Button variant="ghost" size="icon-xs" className="cursor-pointer text-muted-foreground hover:text-destructive" onClick={() => removeOptionalField(i, "relationship")}><Trash2 className="size-3" /></Button>
                    </div>
                    <Input value={item.relationship} onChange={e => update(i, "relationship", e.target.value)} placeholder={zh ? "博士导师" : "PhD Advisor"} />
                  </div>
                )}

                {/* Optional: Address */}
                {item.address !== undefined && (
                  <div className="grid gap-1.5">
                    <div className="flex items-center justify-between">
                      <Label className="text-xs">{zh ? OPTIONAL_FIELD_META.address.labelZh : OPTIONAL_FIELD_META.address.label}</Label>
                      <Button variant="ghost" size="icon-xs" className="cursor-pointer text-muted-foreground hover:text-destructive" onClick={() => removeOptionalField(i, "address")}><Trash2 className="size-3" /></Button>
                    </div>
                    <Input value={item.address} onChange={e => update(i, "address", e.target.value)} placeholder={zh ? "计算机系，北京大学，北京 100871" : "Department of Computer Science, Imperial College London, UK"} />
                  </div>
                )}

                {/* Optional: Phone */}
                {item.phone !== undefined && (
                  <div className="grid gap-1.5">
                    <div className="flex items-center justify-between">
                      <Label className="text-xs">{zh ? OPTIONAL_FIELD_META.phone.labelZh : OPTIONAL_FIELD_META.phone.label}</Label>
                      <Button variant="ghost" size="icon-xs" className="cursor-pointer text-muted-foreground hover:text-destructive" onClick={() => removeOptionalField(i, "phone")}><Trash2 className="size-3" /></Button>
                    </div>
                    <Input value={item.phone} onChange={e => update(i, "phone", e.target.value)} placeholder="+1 617 253 0000" />
                  </div>
                )}

                {/* Optional: Email */}
                {item.email !== undefined && (
                  <div className="grid gap-1.5">
                    <div className="flex items-center justify-between">
                      <Label className="text-xs">{zh ? OPTIONAL_FIELD_META.email.labelZh : OPTIONAL_FIELD_META.email.label}</Label>
                      <Button variant="ghost" size="icon-xs" className="cursor-pointer text-muted-foreground hover:text-destructive" onClick={() => removeOptionalField(i, "email")}><Trash2 className="size-3" /></Button>
                    </div>
                    <Input value={item.email} onChange={e => update(i, "email", e.target.value)} placeholder="referee@example.com" />
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
