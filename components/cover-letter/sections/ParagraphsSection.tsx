"use client";

import { ChevronDown, ChevronUp, Plus, Trash2 } from "lucide-react";
import type { ParagraphItem } from "@/lib/types/cover-letter";
import { Button } from "@/components/ui/button";
import { useUILanguage } from "@/lib/ui-language";
import { t } from "@/lib/translations";
import { normalizeTextareaValue } from "@/lib/text";

interface Props {
  items: ParagraphItem[];
  onChange: (items: ParagraphItem[]) => void;
  collapsed: boolean;
  onToggleCollapse: () => void;
}

export function ParagraphsSection({ items, onChange, collapsed, onToggleCollapse }: Props) {
  const { lang } = useUILanguage();
  const tr = t[lang].coverLetter;

  function add() {
    onChange([...items, { id: crypto.randomUUID(), text: "" }]);
  }

  function remove(i: number) {
    onChange(items.filter((_, idx) => idx !== i));
  }

  function move(i: number, dir: -1 | 1) {
    const target = i + dir;
    if (target < 0 || target >= items.length) return;
    const next = [...items];
    [next[i], next[target]] = [next[target], next[i]];
    onChange(next);
  }

  function update(i: number, text: string) {
    onChange(items.map((item, idx) => idx === i ? { ...item, text } : item));
  }

  return (
    <section className="section-card rounded-lg border border-border">
      <button
        type="button"
        className="section-header flex w-full cursor-pointer items-center justify-between px-4 py-3 text-sm font-semibold tracking-tight transition-colors hover:text-foreground"
        onClick={onToggleCollapse}
      >
        {"Body Paragraphs"}
        <ChevronDown className={`size-4 text-muted-foreground transition-transform duration-200 ${collapsed ? "-rotate-90" : ""}`} />
      </button>

      {!collapsed && (
        <div className="border-t border-border px-4 pb-4 pt-3">
          <div className="space-y-2">
            {items.map((item, i) => (
              <div key={item.id} className="flex gap-1.5">
                {/* Textarea */}
                <textarea
                  value={normalizeTextareaValue(item.text)}
                  onChange={(e) => update(i, normalizeTextareaValue(e.target.value))}
                  placeholder={tr.paragraphPlaceholder}
                  rows={4}
                  className="flex-1 resize-none rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                />
                {/* Controls */}
                <div className="flex flex-col items-center gap-0.5 pt-0.5">
                  <Button
                    variant="ghost" size="icon-xs"
                    className="cursor-pointer text-muted-foreground hover:text-foreground disabled:opacity-30"
                    disabled={i === 0}
                    onClick={() => move(i, -1)}
                  >
                    <ChevronUp className="size-3" />
                  </Button>
                  <Button
                    variant="ghost" size="icon-xs"
                    className="cursor-pointer text-muted-foreground hover:text-foreground disabled:opacity-30"
                    disabled={i === items.length - 1}
                    onClick={() => move(i, 1)}
                  >
                    <ChevronDown className="size-3" />
                  </Button>
                  <Button
                    variant="ghost" size="icon-xs"
                    className="cursor-pointer text-muted-foreground hover:text-destructive"
                    onClick={() => remove(i)}
                  >
                    <Trash2 className="size-3" />
                  </Button>
                </div>
              </div>
            ))}
          </div>

          <Button
            variant="ghost" size="xs"
            className="add-btn mt-2 cursor-pointer gap-1 text-xs"
            onClick={add}
          >
            <Plus className="size-3" />
            {tr.addParagraph}
          </Button>
        </div>
      )}
    </section>
  );
}
