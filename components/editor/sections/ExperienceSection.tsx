"use client";

import { useState } from "react";
import { Plus, Trash2, ChevronUp, ChevronDown, ChevronRight } from "lucide-react";
import type { ExperienceItem, DescriptionField } from "@/lib/types/resume";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface ExperienceSectionProps {
  items: ExperienceItem[];
  onChange: (items: ExperienceItem[]) => void;
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
    descriptions: [emptyDescription()],
  };
}

export function ExperienceSection({ items, onChange }: ExperienceSectionProps) {
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
          <Plus className="size-3" /> Add Entry
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
}) {
  const [collapsed, setCollapsed] = useState(false);
  const descriptions = exp.descriptions ?? [emptyDescription()];

  function updateDesc(id: string, value: string) {
    onDescriptionsChange(descriptions.map((d) => (d.id === id ? { ...d, value } : d)));
  }

  function addDesc() {
    onDescriptionsChange([...descriptions, emptyDescription()]);
  }

  function removeDesc(id: string) {
    if (descriptions.length <= 1) return;
    onDescriptionsChange(descriptions.filter((d) => d.id !== id));
  }

  const headerText = [exp.company, exp.position].filter(Boolean).join(" · ") || `Entry #${index + 1}`;

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
              <Label className="text-xs">Company / Organization</Label>
              <Input value={exp.company} onChange={(e) => onUpdate("company", e.target.value)} placeholder="Google" />
            </div>
            <div className="flex flex-col gap-1">
              <Label className="text-xs">Position</Label>
              <Input value={exp.position} onChange={(e) => onUpdate("position", e.target.value)} placeholder="Software Engineer" />
            </div>
            <div className="flex flex-col gap-1">
              <Label className="text-xs">Location</Label>
              <Input value={exp.location} onChange={(e) => onUpdate("location", e.target.value)} placeholder="London, UK" />
            </div>
            <div className="flex flex-col gap-1">
              <Label className="text-xs">Start Date</Label>
              <Input value={exp.startDate} onChange={(e) => onUpdate("startDate", e.target.value)} placeholder="Jan 2024" />
            </div>
            <div className="flex flex-col gap-1">
              <Label className="text-xs">End Date</Label>
              <Input value={exp.endDate} onChange={(e) => onUpdate("endDate", e.target.value)} placeholder="Present" />
            </div>
          </div>

          {/* Description fields */}
          <div className="mt-3 space-y-2">
            <Label className="text-xs text-muted-foreground">Descriptions</Label>
            {descriptions.map((desc) => (
              <div key={desc.id} className="flex items-center gap-2">
                <Input
                  className="flex-1"
                  value={desc.value}
                  onChange={(e) => updateDesc(desc.id, e.target.value)}
                  placeholder="Describe a responsibility or achievement..."
                />
                <Button
                  variant="ghost" size="icon-xs"
                  className="cursor-pointer text-muted-foreground hover:text-destructive disabled:opacity-30"
                  disabled={descriptions.length <= 1}
                  onClick={() => removeDesc(desc.id)}
                >
                  <Trash2 className="size-3" />
                </Button>
              </div>
            ))}
            <button
              type="button"
              className="add-btn inline-flex h-7 cursor-pointer items-center gap-1 rounded-md px-2 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              onClick={addDesc}
            >
              <Plus className="size-3" />
              Add description
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
