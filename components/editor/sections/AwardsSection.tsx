"use client";

import { Plus, Trash2, ChevronUp, ChevronDown } from "lucide-react";
import type { AwardItem, ResumeLanguage } from "@/lib/types/resume";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const EN_MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

function defaultDate(lang: ResumeLanguage): string {
  const d = new Date();
  if (lang === "zh") return `${d.getFullYear()}/${String(d.getMonth() + 1).padStart(2, "0")}`;
  return `${EN_MONTHS[d.getMonth()]} ${d.getFullYear()}`;
}

function emptyAward(): AwardItem {
  return { id: crypto.randomUUID(), award: "", date: "" };
}

interface AwardsSectionProps {
  items: AwardItem[];
  onChange: (items: AwardItem[]) => void;
  language: ResumeLanguage;
}

export function AwardsSection({ items, onChange, language }: AwardsSectionProps) {
  const zh = language === "zh";

  function update(index: number, field: keyof AwardItem, value: string) {
    onChange(items.map((item, i) => (i === index ? { ...item, [field]: value } : item)));
  }

  function add() {
    onChange([...items, emptyAward()]);
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

  return (
    <div>
      <div className="space-y-3">
        <Button variant="ghost" size="xs" className="add-btn cursor-pointer gap-1 text-xs" onClick={add}>
          <Plus className="size-3" /> {zh ? "添加条目" : "Add Entry"}
        </Button>
        {items.map((item, i) => (
          <div key={item.id} className="skill-row flex items-end gap-2 px-1 py-0.5">
            <div className="mb-0.5 flex flex-col">
              <Button
                variant="ghost" size="icon-xs"
                className="cursor-pointer text-muted-foreground hover:text-foreground disabled:opacity-30"
                disabled={i === 0} onClick={() => move(i, -1)}
              >
                <ChevronUp className="size-3" />
              </Button>
              <Button
                variant="ghost" size="icon-xs"
                className="cursor-pointer text-muted-foreground hover:text-foreground disabled:opacity-30"
                disabled={i === items.length - 1} onClick={() => move(i, 1)}
              >
                <ChevronDown className="size-3" />
              </Button>
            </div>

            <div className="grid flex-1 grid-cols-[1fr_120px] gap-2">
              <div className="flex flex-col gap-1">
                <Label className="text-xs">{zh ? "奖项" : "Award"}</Label>
                <Input
                  value={item.award}
                  onChange={(e) => update(i, "award", e.target.value)}
                  placeholder={zh ? "国家奖学金" : "National Scholarship"}
                />
              </div>
              <div className="flex flex-col gap-1">
                <Label className="text-xs">{zh ? "日期" : "Date"}</Label>
                <Input
                  value={item.date}
                  onChange={(e) => update(i, "date", e.target.value)}
                  placeholder={defaultDate(language)}
                />
              </div>
            </div>

            <Button variant="ghost" size="icon-xs" className="mb-0.5 cursor-pointer text-destructive hover:bg-destructive/10" onClick={() => remove(i)}>
              <Trash2 className="size-3" />
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
}
