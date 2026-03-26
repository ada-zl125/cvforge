"use client";

import { Plus, Trash2 } from "lucide-react";
import type { SkillGroup } from "@/lib/types/resume";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface SkillsSectionProps {
  items: SkillGroup[];
  onChange: (items: SkillGroup[]) => void;
}

function emptySkillGroup(): SkillGroup {
  return { id: crypto.randomUUID(), category: "", items: [] };
}

export function SkillsSection({ items, onChange }: SkillsSectionProps) {
  function updateCategory(index: number, category: string) {
    const next = items.map((g, i) => (i === index ? { ...g, category } : g));
    onChange(next);
  }

  function updateItems(index: number, raw: string) {
    const skills = raw.split(",").map((s) => s.trimStart());
    const next = items.map((g, i) => (i === index ? { ...g, items: skills } : g));
    onChange(next);
  }

  function add() {
    onChange([...items, emptySkillGroup()]);
  }

  function remove(index: number) {
    onChange(items.filter((_, i) => i !== index));
  }

  return (
    <div>
      <div className="space-y-4">
        <Button variant="ghost" size="xs" className="cursor-pointer gap-1 text-xs" onClick={add}>
          <Plus className="size-3" /> Add Entry
        </Button>
        {items.map((group, i) => (
          <div key={group.id} className="flex items-start gap-2">
            <div className="grid flex-1 grid-cols-[120px_1fr] gap-2">
              <div className="flex flex-col gap-1">
                <Label className="text-xs">Category</Label>
                <Input value={group.category} onChange={(e) => updateCategory(i, e.target.value)} placeholder="Languages" />
              </div>
              <div className="flex flex-col gap-1">
                <Label className="text-xs">Skills (comma-separated)</Label>
                <Input value={group.items.join(", ")} onChange={(e) => updateItems(i, e.target.value)} placeholder="Python, JavaScript, Go" />
              </div>
            </div>
            <Button variant="ghost" size="icon-xs" className="mt-5 cursor-pointer text-destructive hover:bg-destructive/10" onClick={() => remove(i)}>
              <Trash2 className="size-3" />
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
}
