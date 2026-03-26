"use client";

import { Plus, Trash2 } from "lucide-react";
import type { ProjectItem } from "@/lib/types/resume";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface ProjectsSectionProps {
  items: ProjectItem[];
  onChange: (items: ProjectItem[]) => void;
}

function emptyProject(): ProjectItem {
  return { id: crypto.randomUUID(), name: "", url: "", startDate: "", endDate: "", description: "", technologies: [] };
}

export function ProjectsSection({ items, onChange }: ProjectsSectionProps) {
  function update(index: number, field: keyof ProjectItem, value: string | string[]) {
    const next = items.map((item, i) => (i === index ? { ...item, [field]: value } : item));
    onChange(next);
  }

  function add() {
    onChange([...items, emptyProject()]);
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
        {items.map((proj, i) => (
          <div key={proj.id} className="rounded-lg border border-border p-3">
            <div className="mb-2 flex items-center justify-between">
              <span className="text-xs font-medium text-muted-foreground">#{i + 1}</span>
              <Button variant="ghost" size="icon-xs" className="cursor-pointer text-destructive hover:bg-destructive/10" onClick={() => remove(i)}>
                <Trash2 className="size-3" />
              </Button>
            </div>
            <div className="grid grid-cols-2 gap-x-3 gap-y-2">
              <div className="col-span-2 flex flex-col gap-1">
                <Label className="text-xs">Project Name</Label>
                <Input value={proj.name} onChange={(e) => update(i, "name", e.target.value)} placeholder="My Project" />
              </div>
              <div className="flex flex-col gap-1">
                <Label className="text-xs">Start Date</Label>
                <Input value={proj.startDate} onChange={(e) => update(i, "startDate", e.target.value)} placeholder="Jan 2024" />
              </div>
              <div className="flex flex-col gap-1">
                <Label className="text-xs">End Date</Label>
                <Input value={proj.endDate} onChange={(e) => update(i, "endDate", e.target.value)} placeholder="Mar 2024" />
              </div>
              <div className="col-span-2 flex flex-col gap-1">
                <Label className="text-xs">Description (one bullet per line)</Label>
                <textarea
                  className="min-h-16 w-full rounded-lg border border-input bg-transparent px-2.5 py-1.5 text-sm outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
                  value={proj.description}
                  onChange={(e) => update(i, "description", e.target.value)}
                  placeholder="Describe the project, technologies used, and outcomes..."
                />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
