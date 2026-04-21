"use client";

import { useState } from "react";
import { Plus, Trash2, ChevronUp, ChevronDown, ChevronRight } from "lucide-react";
import type { ServiceItem, ResumeLanguage } from "@/lib/types/academic-cv";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useUILanguage } from "@/lib/ui-language";
import { t } from "@/lib/translations";

function emptyService(): ServiceItem {
  return { id: crypto.randomUUID(), role: "", organization: "", date: "" };
}

interface Props {
  items: ServiceItem[];
  onChange: (items: ServiceItem[]) => void;
  language: ResumeLanguage;
}

export function ServiceSection({ items, onChange, language }: Props) {
  const { lang } = useUILanguage();
  const tr = t[lang].academicCv;
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});

  function update<K extends keyof ServiceItem>(i: number, field: K, value: ServiceItem[K]) {
    onChange(items.map((item, idx) => idx === i ? { ...item, [field]: value } : item));
  }
  function add() { onChange([...items, emptyService()]); }
  function remove(i: number) { onChange(items.filter((_, idx) => idx !== i)); }
  function move(i: number, dir: -1 | 1) {
    const t2 = i + dir;
    if (t2 < 0 || t2 >= items.length) return;
    const next = [...items];
    [next[i], next[t2]] = [next[t2], next[i]];
    onChange(next);
  }

  const zh = lang === "zh";
  const contentZh = language === "zh";

  return (
    <div className="space-y-3">
      <Button variant="ghost" size="xs" className="add-btn cursor-pointer gap-1 text-xs" onClick={add}>
        <Plus className="size-3" /> {tr.addEntry}
      </Button>
      {items.map((item, i) => {
        const isCollapsed = collapsed[item.id] ?? true;
        const header = [item.role, item.organization].filter(Boolean).join(" · ") || `Entry #${i + 1}`;

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
                <div className="grid grid-cols-2 gap-2">
                  <div className="grid gap-1.5">
                    <Label className="text-xs">{zh ? "职务" : "Role"}</Label>
                    <Input value={item.role} onChange={e => update(i, "role", e.target.value)} placeholder={contentZh ? "审稿人 / 委员会成员" : "Reviewer / Committee Member"} />
                  </div>
                  <div className="grid gap-1.5">
                    <Label className="text-xs">{tr.date}</Label>
                    <Input value={item.date} onChange={e => update(i, "date", e.target.value)} placeholder="2024" />
                  </div>
                </div>
                <div className="grid gap-1.5">
                  <Label className="text-xs">{zh ? "机构 / 期刊 / 会议" : "Organization / Journal / Conference"}</Label>
                  <Input value={item.organization} onChange={e => update(i, "organization", e.target.value)} placeholder={zh ? "NeurIPS / IEEE TPAMI" : "NeurIPS / IEEE TPAMI"} />
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
