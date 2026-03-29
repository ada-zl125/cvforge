"use client";

import { useState } from "react";
import { Plus, Trash2, ChevronUp, ChevronDown, ChevronRight } from "lucide-react";
import type { ProjectItem, DescriptionField, ResumeLanguage } from "@/lib/types/resume";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";

const EN_MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

function defaultDate(yearsOffset: number, lang: ResumeLanguage): string {
  const d = new Date();
  d.setFullYear(d.getFullYear() + yearsOffset);
  if (lang === "zh") return `${d.getFullYear()}/${String(d.getMonth() + 1).padStart(2, "0")}`;
  return `${EN_MONTHS[d.getMonth()]} ${d.getFullYear()}`;
}

interface ProjectsSectionProps {
  items: ProjectItem[];
  onChange: (items: ProjectItem[]) => void;
  language: ResumeLanguage;
}

function emptyDescription(): DescriptionField {
  return { id: crypto.randomUUID(), value: "" };
}

function emptyProject(): ProjectItem {
  return {
    id: crypto.randomUUID(),
    name: "",
    websiteLabel: "",
    websiteUrl: "",
    startDate: "",
    endDate: "",
    descriptions: [emptyDescription()],
  };
}

export function ProjectsSection({ items, onChange, language }: ProjectsSectionProps) {
  function update(index: number, field: keyof ProjectItem, value: string) {
    const next = items.map((item, i) => (i === index ? { ...item, [field]: value } : item));
    onChange(next);
  }

  function add() {
    onChange([...items, emptyProject()]);
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
          <Plus className="size-3" /> {language === "zh" ? "添加条目" : "Add Entry"}
        </Button>
        {items.map((proj, i) => (
          <ProjectBlock
            key={proj.id}
            proj={proj}
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
/*  Project block — one project entry                                  */
/* ------------------------------------------------------------------ */

function ProjectBlock({
  proj,
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
  proj: ProjectItem;
  index: number;
  isFirst: boolean;
  isLast: boolean;
  onUpdate: (field: keyof ProjectItem, value: string) => void;
  onRemove: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onDescriptionsChange: (descs: DescriptionField[]) => void;
  language: ResumeLanguage;
}) {
  const [collapsed, setCollapsed] = useState(false);
  const [websiteVisible, setWebsiteVisible] = useState(Boolean(proj.websiteLabel || proj.websiteUrl));
  const descriptions = proj.descriptions ?? [emptyDescription()];
  const zh = language === "zh";

  function updateDesc(id: string, value: string) {
    onDescriptionsChange(descriptions.map((d) => (d.id === id ? { ...d, value } : d)));
  }

  function addDesc() {
    onDescriptionsChange([...descriptions, emptyDescription()]);
  }

  function removeDesc(id: string) {
    onDescriptionsChange(descriptions.filter((d) => d.id !== id));
  }

  function removeWebsite() {
    setWebsiteVisible(false);
    onUpdate("websiteLabel", "");
    onUpdate("websiteUrl", "");
  }

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
          <span className="text-xs font-medium">{proj.name || `${zh ? "条目" : "Entry"} #${index + 1}`}</span>
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
              <Label className="text-xs">{zh ? "项目名称" : "Project Name"}</Label>
              <Input value={proj.name} onChange={(e) => onUpdate("name", e.target.value)} placeholder={zh ? "我的项目" : "My Project"} />
            </div>
            <div className="flex flex-col gap-1">
              <Label className="text-xs">{zh ? "开始时间" : "Start Date"}</Label>
              <Input value={proj.startDate} onChange={(e) => onUpdate("startDate", e.target.value)} placeholder={defaultDate(-4, language)} />
            </div>
            <div className="flex flex-col gap-1">
              <Label className="text-xs">{zh ? "结束时间" : "End Date"}</Label>
              <Input value={proj.endDate} onChange={(e) => onUpdate("endDate", e.target.value)} placeholder={defaultDate(0, language)} />
            </div>
          </div>

          {/* Optional website field */}
          {websiteVisible && (
            <div className="mt-3 flex items-end gap-2">
              <div className="flex flex-1 flex-col gap-1">
                <Label className="text-xs text-muted-foreground">{zh ? "网站" : "Website"}</Label>
                <div className="flex gap-2">
                  <Input
                    className="w-28"
                    value={proj.websiteLabel ?? ""}
                    onChange={(e) => onUpdate("websiteLabel", e.target.value)}
                    placeholder="GitHub"
                  />
                  <Input
                    className="flex-1"
                    value={proj.websiteUrl ?? ""}
                    onChange={(e) => onUpdate("websiteUrl", e.target.value)}
                    placeholder="https://github.com/user/project"
                  />
                </div>
              </div>
              <Button
                variant="ghost" size="icon-xs"
                className="mb-0.5 cursor-pointer text-muted-foreground hover:text-destructive"
                onClick={removeWebsite}
              >
                <Trash2 className="size-3" />
              </Button>
            </div>
          )}

          {/* Description fields */}
          {descriptions.length > 0 && (
            <div className="mt-3 space-y-2">
              <Label className="text-xs text-muted-foreground">{zh ? "项目描述" : "Descriptions"}</Label>
              {descriptions.map((desc) => (
                <div key={desc.id} className="flex items-center gap-2">
                  <Input
                    className="flex-1"
                    value={desc.value}
                    onChange={(e) => updateDesc(desc.id, e.target.value)}
                    placeholder={zh ? "描述项目特性、技术栈或成果..." : "Describe a feature, technology, or outcome..."}
                  />
                  <Button
                    variant="ghost" size="icon-xs"
                    className="cursor-pointer text-muted-foreground hover:text-destructive"
                    onClick={() => removeDesc(desc.id)}
                  >
                    <Trash2 className="size-3" />
                  </Button>
                </div>
              ))}
            </div>
          )}

          {/* Add field dropdown */}
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
                {!websiteVisible && (
                  <DropdownMenuItem className="cursor-pointer" onClick={() => setWebsiteVisible(true)}>
                    {zh ? "网站" : "Website"}
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      )}
    </div>
  );
}
