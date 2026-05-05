"use client";

import { useState, useCallback } from "react";
import { ChevronDown, ChevronUp, ChevronsUpDown, ChevronsDownUp, Plus, RotateCcw, Trash2 } from "lucide-react";
import type { CoverLetterContent } from "@/lib/types/cover-letter";
import { defaultCoverLetterContent } from "@/lib/defaults";
import { useUILanguage } from "@/lib/ui-language";
import { t } from "@/lib/translations";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogAction,
  AlertDialogCancel,
} from "@/components/ui/alert-dialog";
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
  const [resetOpen, setResetOpen] = useState(false);

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

  function handleReset() {
    onChange(defaultCoverLetterContent);
    setSenderCollapsed(false);
    setRecipientCollapsed(false);
    setParagraphCollapsed({});
    setResetOpen(false);
  }

  return (
    <div className="flex min-w-0 flex-col gap-4 p-5">
      {/* Toolbar */}
      <div className="flex items-center gap-1.5">
        <Button
          variant="outline"
          size="sm"
          className="btn-hover-border cursor-pointer gap-1.5 text-xs"
          onClick={toggleAll}
        >
          {allCollapsed ? <ChevronsUpDown className="size-3.5" /> : <ChevronsDownUp className="size-3.5" />}
          {allCollapsed ? tr.expandAll : tr.collapseAll}
        </Button>

        <Button
          variant="outline"
          size="sm"
          className="btn-hover-border cursor-pointer gap-1.5 text-xs"
          onClick={() => setResetOpen(true)}
        >
          <RotateCcw className="size-3.5" />
          {tr.resetBtn}
        </Button>
      </div>

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
          <section key={para.id} className="section-card rounded-lg border border-border">
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
              <div className="border-t border-border px-4 pb-4 pt-3">
                <textarea
                  value={para.text}
                  onChange={(e) => updateParagraph(para.id, e.target.value)}
                  placeholder={cl.paragraphPlaceholder}
                  rows={5}
                  className="w-full resize-none rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                />
              </div>
            )}
          </section>
        );
      })}

      {/* Add Paragraph */}
      <button
        type="button"
        className="add-section-btn flex h-9 w-full cursor-pointer items-center justify-center gap-1.5 rounded-lg border border-dashed border-border text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground"
        onClick={addParagraph}
      >
        <Plus className="size-4" />
        {cl.addParagraph}
      </button>

      {/* Reset dialog */}
      <AlertDialog open={resetOpen} onOpenChange={setResetOpen}>
        <AlertDialogContent size="sm" className="editor-dialog overflow-hidden p-0">
          <AlertDialogHeader className="editor-dialog-header place-items-start px-5 pb-4 pt-5 text-left">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-black/40 bg-black/[0.035]">
                <RotateCcw className="h-4 w-4 text-foreground" />
              </div>
              <AlertDialogTitle className="text-[15px] font-semibold leading-tight">{cl.resetTitle}</AlertDialogTitle>
            </div>
            <AlertDialogDescription className="pt-1 text-sm leading-relaxed text-gray-600">{cl.resetDesc}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="editor-dialog-footer">
            <AlertDialogCancel className="editor-dialog-cancel cursor-pointer">{tr.cancel}</AlertDialogCancel>
            <AlertDialogAction
              variant="outline"
              className="editor-dialog-soft-action cursor-pointer"
              onClick={handleReset}
            >
              {tr.resetConfirm}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
