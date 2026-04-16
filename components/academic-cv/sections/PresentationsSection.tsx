"use client";

import { useState } from "react";
import { Plus, Trash2, ChevronUp, ChevronDown, ChevronRight } from "lucide-react";
import type { PresentationItem, ResumeLanguage } from "@/lib/types/academic-cv";
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

function emptyPresentation(): PresentationItem {
  return { id: crypto.randomUUID(), event: "", title: "", location: "", date: "" };
}

interface Props {
  items: PresentationItem[];
  onChange: (items: PresentationItem[]) => void;
  language: ResumeLanguage;
}

export function PresentationsSection({ items, onChange, language }: Props) {
  const { lang } = useUILanguage();
  const tr = t[lang].academicCv;
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});

  function update<K extends keyof PresentationItem>(i: number, field: K, value: PresentationItem[K]) {
    onChange(items.map((item, idx) => idx === i ? { ...item, [field]: value } : item));
  }
  function add() { onChange([...items, emptyPresentation()]); }
  function remove(i: number) { onChange(items.filter((_, idx) => idx !== i)); }
  function move(i: number, dir: -1 | 1) {
    const t2 = i + dir;
    if (t2 < 0 || t2 >= items.length) return;
    const next = [...items];
    [next[i], next[t2]] = [next[t2], next[i]];
    onChange(next);
  }

  function removeType(i: number) {
    const next = { ...items[i] };
    delete next.type;
    onChange(items.map((item, idx) => idx === i ? next : item));
  }

  return (
    <div className="space-y-3">
      <Button variant="ghost" size="xs" className="add-btn cursor-pointer gap-1 text-xs" onClick={add}>
        <Plus className="size-3" /> {tr.addEntry}
      </Button>
      {items.map((item, i) => {
        const isCollapsed = collapsed[item.id] ?? false;
        const header = item.event || `Entry #${i + 1}`;
        const zh = language === "zh";

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
                  <Label className="text-xs">{tr.event}</Label>
                  <Input value={item.event} onChange={e => update(i, "event", e.target.value)} placeholder={zh ? "国际机器学习大会（ICML 2024）" : "International Conference on Machine Learning (ICML 2024)"} />
                </div>
                <div className="grid gap-1.5">
                  <Label className="text-xs">{zh ? "报告题目" : "Title"}</Label>
                  <Input value={item.title} onChange={e => update(i, "title", e.target.value)} placeholder={zh ? "报告题目" : "Title of your presentation"} />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="grid gap-1.5">
                    <Label className="text-xs">{zh ? "地点" : "Location"}</Label>
                    <Input value={item.location} onChange={e => update(i, "location", e.target.value)} placeholder="Vienna, Austria" />
                  </div>
                  <div className="grid gap-1.5">
                    <Label className="text-xs">{tr.date}</Label>
                    <Input value={item.date} onChange={e => update(i, "date", e.target.value)} placeholder={zh ? "2024/07" : "Jul 2024"} />
                  </div>
                </div>

                {/* Optional: Type */}
                {item.type !== undefined && (
                  <div className="grid gap-1.5">
                    <div className="flex items-center justify-between">
                      <Label className="text-xs">{zh ? "类型" : "Field"}</Label>
                      <Button variant="ghost" size="icon-xs" className="cursor-pointer text-muted-foreground hover:text-destructive" onClick={() => removeType(i)}><Trash2 className="size-3" /></Button>
                    </div>
                    <Input value={item.type} onChange={e => update(i, "type", e.target.value)} placeholder={zh ? "口头报告 / 海报 / 特邀" : "Oral / Poster / Invited"} />
                  </div>
                )}

                {/* Add field */}
                {item.type === undefined && (
                  <DropdownMenu>
                    <DropdownMenuTrigger className="add-btn inline-flex h-7 cursor-pointer items-center gap-1 rounded-md px-2 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground">
                      <Plus className="size-3" />
                      {zh ? "添加字段" : "Add field"}
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="start" sideOffset={4}>
                      <DropdownMenuItem className="cursor-pointer" onClick={() => update(i, "type", "")}>
                        {zh ? "类型" : "Field"}
                      </DropdownMenuItem>
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
