"use client";

import { Plus, Trash2, ChevronUp, ChevronDown } from "lucide-react";
import type { PublicationItem, ResumeLanguage } from "@/lib/types/academic-cv";
import { moveItem, removeItemAt, updateItemAt } from "@/lib/list-utils";
import { Button } from "@/components/ui/button";
import { useUILanguage } from "@/lib/ui-language";
import { t } from "@/lib/translations";
import { normalizeTextareaValue } from "@/lib/text";

function emptyPublication(): PublicationItem {
  return { id: crypto.randomUUID(), citation: "" };
}

interface Props {
  items: PublicationItem[];
  onChange: (items: PublicationItem[]) => void;
  language?: ResumeLanguage;
}

export function PublicationsSection({ items, onChange }: Props) {
  const { lang } = useUILanguage();
  const tr = t[lang].academicCv;

  function update(i: number, value: string) {
    onChange(updateItemAt(items, i, (item) => ({ ...item, citation: value })));
  }
  function add() { onChange([...items, emptyPublication()]); }
  function remove(i: number) { onChange(removeItemAt(items, i)); }
  function move(i: number, dir: -1 | 1) {
    onChange(moveItem(items, i, dir));
  }

  return (
    <div className="space-y-2">
      <Button variant="ghost" size="xs" className="add-btn cursor-pointer gap-1 text-xs" onClick={add}>
        <Plus className="size-3" /> {tr.addEntry}
      </Button>
      {items.map((item, i) => (
        <div key={item.id} className="skill-row flex items-start gap-2 px-1 py-0.5">
          <div className="mt-1 flex flex-col">
            <Button variant="ghost" size="icon-xs" className="cursor-pointer text-muted-foreground hover:text-foreground disabled:opacity-30" disabled={i === 0} onClick={() => move(i, -1)}><ChevronUp className="size-3" /></Button>
            <Button variant="ghost" size="icon-xs" className="cursor-pointer text-muted-foreground hover:text-foreground disabled:opacity-30" disabled={i === items.length - 1} onClick={() => move(i, 1)}><ChevronDown className="size-3" /></Button>
          </div>
          <textarea
            value={normalizeTextareaValue(item.citation)}
            onChange={e => update(i, normalizeTextareaValue(e.target.value))}
            placeholder={tr.citationPlaceholder}
            rows={2}
            className="flex-1 resize-none rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
          />
          <Button variant="ghost" size="icon-xs" className="mt-1 cursor-pointer text-muted-foreground hover:text-destructive" onClick={() => remove(i)}>
            <Trash2 className="size-3" />
          </Button>
        </div>
      ))}
    </div>
  );
}
