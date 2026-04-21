"use client";

import { Plus, Trash2, ChevronUp, ChevronDown } from "lucide-react";
import type { SkillGroup, ResumeLanguage } from "@/lib/types/resume";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useUILanguage } from "@/lib/ui-language";

interface SkillsSectionProps {
  items: SkillGroup[];
  onChange: (items: SkillGroup[]) => void;
  language: ResumeLanguage;
}

function emptySkillGroup(): SkillGroup {
  return { id: crypto.randomUUID(), category: "", items: "" };
}

export function SkillsSection({ items, onChange, language }: SkillsSectionProps) {
  const { lang } = useUILanguage();
  const zh = lang === "zh";
  const contentZh = language === "zh";

  function update(index: number, field: "category" | "items", value: string) {
    const next = items.map((g, i) => (i === index ? { ...g, [field]: value } : g));
    onChange(next);
  }

  function add() {
    onChange([...items, emptySkillGroup()]);
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
        {items.map((group, i) => (
          <div key={group.id} className="skill-row flex items-end gap-2 px-1 py-0.5">
            {/* Move up/down */}
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

            <div className="grid flex-1 grid-cols-[120px_1fr] gap-2">
              <div className="flex flex-col gap-1">
                <Label className="text-xs">{zh ? "分类" : "Category"}</Label>
                <Input value={group.category} onChange={(e) => update(i, "category", e.target.value)} placeholder={contentZh ? "技术栈" : "Tech Stack"} />
              </div>
              <div className="flex flex-col gap-1">
                <Label className="text-xs">{zh ? "技能" : "Skills"}</Label>
                <Input value={group.items} onChange={(e) => update(i, "items", e.target.value)} placeholder="FastAPI, LangChain, LangGraph, LlamaIndex" />
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
