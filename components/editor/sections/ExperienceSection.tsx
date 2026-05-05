"use client";

import { useState } from "react";
import { Plus, Trash2, ChevronUp, ChevronDown, ChevronRight } from "lucide-react";
import type { ExperienceItem, DescriptionField, ResumeLanguage } from "@/lib/types/resume";
import { defaultDate } from "@/lib/defaults";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { normalizeTextareaValue } from "@/lib/text";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import { useUILanguage } from "@/lib/ui-language";


interface ExperienceSectionProps {
  items: ExperienceItem[];
  onChange: (items: ExperienceItem[]) => void;
  language: ResumeLanguage;
}

function emptyDescription(): DescriptionField {
  return { id: crypto.randomUUID(), value: "" };
}

function emptyExperience(): ExperienceItem {
  return {
    id: crypto.randomUUID(),
    company: "",
    position: "",
    location: "",
    startDate: "",
    endDate: "",
    descriptions: [],
  };
}

export function ExperienceSection({ items, onChange, language }: ExperienceSectionProps) {
  const { lang } = useUILanguage();
  function update(index: number, field: keyof ExperienceItem, value: string) {
    const next = items.map((item, i) => (i === index ? { ...item, [field]: value } : item));
    onChange(next);
  }

  function add() {
    onChange([...items, emptyExperience()]);
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

  function updateDescriptions(index: number, descriptions: DescriptionField[]) {
    const next = items.map((item, i) => (i === index ? { ...item, descriptions } : item));
    onChange(next);
  }

  return (
    <div>
      <div className="space-y-4">
        <Button variant="ghost" size="xs" className="add-btn cursor-pointer gap-1 text-xs" onClick={add}>
          <Plus className="size-3" /> {lang === "zh" ? "添加条目" : "Add Entry"}
        </Button>
        {items.map((exp, i) => (
          <ExperienceBlock
            key={exp.id}
            exp={exp}
            index={i}
            isFirst={i === 0}
            isLast={i === items.length - 1}
            onUpdate={(field, value) => update(i, field, value)}
            onRemove={() => remove(i)}
            onMoveUp={() => move(i, -1)}
            onMoveDown={() => move(i, 1)}
            onDescriptionsChange={(descs) => updateDescriptions(i, descs)}
            language={language}
          />
        ))}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Experience block — one experience entry                            */
/* ------------------------------------------------------------------ */

function ExperienceBlock({
  exp,
  index,
  isFirst,
  isLast,
  onUpdate,
  onRemove,
  onMoveUp,
  onMoveDown,
  onDescriptionsChange,
  language,
}: {
  exp: ExperienceItem;
  index: number;
  isFirst: boolean;
  isLast: boolean;
  onUpdate: (field: keyof ExperienceItem, value: string) => void;
  onRemove: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onDescriptionsChange: (descs: DescriptionField[]) => void;
  language: ResumeLanguage;
}) {
  const [collapsed, setCollapsed] = useState(true);
  const descriptions = exp.descriptions ?? [emptyDescription()];
  const { lang } = useUILanguage();
  const zh = lang === "zh";
  const contentZh = language === "zh";

  function updateDesc(id: string, value: string) {
    onDescriptionsChange(descriptions.map((d) => (d.id === id ? { ...d, value } : d)));
  }

  function addDesc() {
    onDescriptionsChange([...descriptions, emptyDescription()]);
  }

  function removeDesc(id: string) {
    onDescriptionsChange(descriptions.filter((d) => d.id !== id));
  }

  function moveDesc(id: string, direction: "up" | "down") {
    const idx = descriptions.findIndex((d) => d.id === id);
    if (idx < 0) return;
    const next = [...descriptions];
    const swapIdx = direction === "up" ? idx - 1 : idx + 1;
    if (swapIdx < 0 || swapIdx >= next.length) return;
    [next[idx], next[swapIdx]] = [next[swapIdx], next[idx]];
    onDescriptionsChange(next);
  }

  const headerText = [exp.company, exp.position].filter(Boolean).join(" · ") || `${zh ? "条目" : "Entry"} #${index + 1}`;

  return (
    <div className="entry-card rounded-lg border border-border">
      {/* Block header — clickable to collapse */}
      <div className="entry-header flex items-stretch justify-between px-3">
        <button
          type="button"
          className="flex flex-1 cursor-pointer items-center gap-1 py-2 text-left"
          onClick={() => setCollapsed(!collapsed)}
        >
          <ChevronRight className={`size-3 text-muted-foreground transition-transform duration-200 ${collapsed ? "" : "rotate-90"}`} />
          <span className="text-xs font-medium">{headerText}</span>
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
              <Label className="text-xs">{zh ? "公司" : "Company"}</Label>
              <Input value={exp.company} onChange={(e) => onUpdate("company", e.target.value)} placeholder={contentZh ? "字节跳动" : "Google"} />
            </div>
            <div className="flex flex-col gap-1">
              <Label className="text-xs">{zh ? "职位" : "Position"}</Label>
              <Input value={exp.position} onChange={(e) => onUpdate("position", e.target.value)} placeholder={contentZh ? "软件工程师" : "Software Engineer"} />
            </div>
            <div className="flex flex-col gap-1">
              <Label className="text-xs">{zh ? "地点" : "Location"}</Label>
              <Input value={exp.location} onChange={(e) => onUpdate("location", e.target.value)} placeholder={contentZh ? "中国, 北京" : "London, UK"} />
            </div>
            <div className="flex flex-col gap-1">
              <Label className="text-xs">{zh ? "开始时间" : "Start Date"}</Label>
              <Input value={exp.startDate} onChange={(e) => onUpdate("startDate", e.target.value)} placeholder={defaultDate(language, -4)} />
            </div>
            <div className="flex flex-col gap-1">
              <Label className="text-xs">{zh ? "结束时间" : "End Date"}</Label>
              <Input value={exp.endDate} onChange={(e) => onUpdate("endDate", e.target.value)} placeholder={defaultDate(language)} />
            </div>
          </div>

          {/* Description fields */}
          {descriptions.length > 0 && (
            <div className="mt-3 space-y-2">
              <Label className="text-xs text-muted-foreground">{zh ? "工作描述" : "Descriptions"}</Label>
              {descriptions.map((desc, di) => (
                <div key={desc.id} className="flex items-start gap-1">
                  <div className="flex flex-col gap-0.5 pt-0.5">
                    <Button
                      variant="ghost" size="icon-xs"
                      className="cursor-pointer text-muted-foreground hover:text-foreground disabled:opacity-30"
                      disabled={di === 0}
                      onClick={() => moveDesc(desc.id, "up")}
                    >
                      <ChevronUp className="size-3" />
                    </Button>
                    <Button
                      variant="ghost" size="icon-xs"
                      className="cursor-pointer text-muted-foreground hover:text-foreground disabled:opacity-30"
                      disabled={di === descriptions.length - 1}
                      onClick={() => moveDesc(desc.id, "down")}
                    >
                      <ChevronDown className="size-3" />
                    </Button>
                  </div>
                  <Textarea
                    className="flex-1 resize-y text-xs"
                    rows={2}
                    value={normalizeTextareaValue(desc.value)}
                    onChange={(e) => updateDesc(desc.id, normalizeTextareaValue(e.target.value))}
                    placeholder={contentZh ? "描述一项职责或成就..." : "Describe a responsibility or achievement..."}
                  />
                  <Button
                    variant="ghost" size="icon-xs"
                    className="mt-0.5 cursor-pointer text-muted-foreground hover:text-destructive"
                    onClick={() => removeDesc(desc.id)}
                  >
                    <Trash2 className="size-3" />
                  </Button>
                </div>
              ))}
            </div>
          )}

          {/* Add field dropdown — always at bottom */}
          <div className="mt-2">
            <DropdownMenu>
              <DropdownMenuTrigger className="add-btn inline-flex h-7 cursor-pointer items-center gap-1 rounded-md px-2 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground">
                <Plus className="size-3" />
                {zh ? "添加字段" : "Add field"}
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" sideOffset={4}>
                <DropdownMenuItem className="cursor-pointer" onClick={addDesc}>
                  {zh ? "描述" : "Description"}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      )}
    </div>
  );
}
