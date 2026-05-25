"use client";

import { useState, useCallback } from "react";
import { ChevronDown, ChevronUp, ChevronsUpDown, ChevronsDownUp, Plus, Trash2 } from "lucide-react";
import type { CoverLetterContent } from "@/lib/types/cover-letter";
import { useUILanguage } from "@/lib/ui-language";
import { t } from "@/lib/translations";
import { Button } from "@/components/ui/button";
import AnimatedContent from "@/components/AnimatedContent";
import SpotlightCard from "@/components/SpotlightCard";
import { normalizeTextareaValue } from "@/lib/text";
import { SenderSection } from "./sections/SenderSection";
import { RecipientSection } from "./sections/RecipientSection";

interface FormPanelProps {
  content: CoverLetterContent;
  onChange: (content: CoverLetterContent) => void;
}

export function FormPanel({ content, onChange }: FormPanelProps) {
  const { lang } = useUILanguage();
  const tr = t[lang];
  const cl = tr.coverLetter;

  const [senderCollapsed, setSenderCollapsed] = useState(false);
  const [recipientCollapsed, setRecipientCollapsed] = useState(false);
  const [paragraphCollapsed, setParagraphCollapsed] = useState<Record<string, boolean>>({});
  const allCollapsed =
    senderCollapsed &&
    recipientCollapsed &&
    content.paragraphs.every((p) => paragraphCollapsed[p.id] !== false);

  const toggleAll = useCallback(() => {
    const target = !allCollapsed;
    setSenderCollapsed(target);
    setRecipientCollapsed(target);
    setParagraphCollapsed((prev) => {
      const next = { ...prev };
      for (const p of content.paragraphs) next[p.id] = target;
      return next;
    });
  }, [allCollapsed, content.paragraphs]);

  function addParagraph() {
    const id = crypto.randomUUID();
    onChange({ ...content, paragraphs: [...content.paragraphs, { id, text: "" }] });
    setParagraphCollapsed((prev) => ({ ...prev, [id]: false }));
  }

  function removeParagraph(id: string) {
    onChange({ ...content, paragraphs: content.paragraphs.filter((p) => p.id !== id) });
  }

  function updateParagraph(id: string, text: string) {
    onChange({ ...content, paragraphs: content.paragraphs.map((p) => p.id === id ? { ...p, text } : p) });
  }

  function moveParagraph(index: number, dir: -1 | 1) {
    const target = index + dir;
    if (target < 0 || target >= content.paragraphs.length) return;
    const next = [...content.paragraphs];
    [next[index], next[target]] = [next[target], next[index]];
    onChange({ ...content, paragraphs: next });
  }

  return (
    <div className="flex min-w-0 flex-col gap-3 p-3">
      {/* Toolbar */}
      <AnimatedContent
        distance={14}
        duration={0.45}
        threshold={0}
        className="flex items-center gap-1.5"
      >
        <Button
          variant="outline"
          size="sm"
          className="btn-hover-border cursor-pointer gap-1.5 text-xs"
          onClick={toggleAll}
        >
          {allCollapsed ? <ChevronsUpDown className="size-3.5" /> : <ChevronsDownUp className="size-3.5" />}
          {allCollapsed ? tr.expandAll : tr.collapseAll}
        </Button>

      </AnimatedContent>

      {/* Sender / Personal Information */}
      <SenderSection
        data={content.sender}
        onChange={(sender) => onChange({ ...content, sender })}
        collapsed={senderCollapsed}
        onToggleCollapse={() => setSenderCollapsed((v) => !v)}
      />

      {/* Date & Recipient */}
      <RecipientSection
        data={content.recipient}
        date={content.date}
        onDateChange={(date) => onChange({ ...content, date })}
        onChange={(recipient) => onChange({ ...content, recipient })}
        collapsed={recipientCollapsed}
        onToggleCollapse={() => setRecipientCollapsed((v) => !v)}
      />

      {/* Individual paragraph sections */}
      {content.paragraphs.map((para, i) => {
        const isCollapsed = paragraphCollapsed[para.id] ?? true;
        return (
          <SpotlightCard
            key={para.id}
            className="section-card rounded-md border border-black/10 bg-white"
            spotlightColor="rgba(0, 0, 0, 0.065)"
          >
            <div className="section-header flex items-stretch justify-between px-4">
              <button
                type="button"
                className="flex flex-1 cursor-pointer items-center gap-2 py-3 text-sm font-semibold tracking-tight transition-colors hover:text-foreground"
                onClick={() => setParagraphCollapsed((prev) => ({ ...prev, [para.id]: !prev[para.id] }))}
              >
                {cl.paragraphSectionLabel(i + 1)}
                <ChevronDown className={`size-4 text-muted-foreground transition-transform duration-200 ${isCollapsed ? "-rotate-90" : ""}`} />
              </button>
              <div className="flex items-center gap-0.5">
                <Button
                  variant="ghost" size="icon-xs"
                  className="cursor-pointer text-muted-foreground hover:text-foreground disabled:opacity-30"
                  disabled={i === 0}
                  onClick={() => moveParagraph(i, -1)}
                >
                  <ChevronUp className="size-3.5" />
                </Button>
                <Button
                  variant="ghost" size="icon-xs"
                  className="cursor-pointer text-muted-foreground hover:text-foreground disabled:opacity-30"
                  disabled={i === content.paragraphs.length - 1}
                  onClick={() => moveParagraph(i, 1)}
                >
                  <ChevronDown className="size-3.5" />
                </Button>
                <Button
                  variant="ghost" size="icon-xs"
                  className="cursor-pointer text-muted-foreground hover:text-destructive"
                  onClick={() => removeParagraph(para.id)}
                >
                  <Trash2 className="size-3.5" />
                </Button>
              </div>
            </div>

            {!isCollapsed && (
              <div className="border-t border-black/10 bg-white/42 px-4 pb-4 pt-3">
                <textarea
                  value={normalizeTextareaValue(para.text)}
                  onChange={(e) => updateParagraph(para.id, normalizeTextareaValue(e.target.value))}
                  placeholder={cl.paragraphPlaceholder}
                  rows={5}
                  className="w-full resize-none rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                />
              </div>
            )}
          </SpotlightCard>
        );
      })}

      {/* Add Paragraph */}
      <button
        type="button"
        className="add-section-btn flex h-9 w-full cursor-pointer items-center justify-center gap-1.5 rounded-md border border-dashed border-border text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground"
        onClick={addParagraph}
      >
        <Plus className="size-4" />
        {cl.addParagraph}
      </button>
    </div>
  );
}
