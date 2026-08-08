"use client";

import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { t } from "@/lib/translations";
import { useUILanguage } from "@/lib/ui-language";

interface ExportErrorDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ExportErrorDialog({ open, onOpenChange }: ExportErrorDialogProps) {
  const { lang } = useUILanguage();
  const tr = t[lang];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="editor-dialog overflow-hidden p-0 sm:max-w-[420px]">
        <DialogHeader className="editor-dialog-header px-5 pb-4 pt-5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-black/40 bg-black/[0.035]">
              <AlertTriangle className="h-4 w-4 text-foreground" />
            </div>
            <DialogTitle className="text-[15px] font-semibold leading-tight">
              {tr.exportErrorTitle}
            </DialogTitle>
          </div>
          <div className="px-0 pt-1">
            <p className="text-sm leading-relaxed text-gray-600">{tr.exportError}</p>
          </div>
        </DialogHeader>
        <DialogFooter className="editor-dialog-footer">
          <Button
            variant="outline"
            className="editor-dialog-action cursor-pointer"
            onClick={() => onOpenChange(false)}
          >
            {tr.close}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
