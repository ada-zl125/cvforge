"use client";

import { useRef, useState } from "react";
import ReactCrop, {
  centerCrop,
  makeAspectCrop,
  type Crop,
  type PixelCrop,
} from "react-image-crop";
import "react-image-crop/dist/ReactCrop.css";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import type { ResumeLanguage } from "@/lib/types/resume";

/* ---- constants ---- */

const PHOTO_ASPECT = 4 / 5;
const OUTPUT_W = 240;
const OUTPUT_H = 300;

/* ---- helpers ---- */

function centerAspectCrop(w: number, h: number): Crop {
  return centerCrop(
    makeAspectCrop({ unit: "%", width: 90 }, PHOTO_ASPECT, w, h),
    w,
    h,
  );
}

async function extractCrop(img: HTMLImageElement, crop: PixelCrop): Promise<string> {
  const canvas = document.createElement("canvas");
  canvas.width = OUTPUT_W;
  canvas.height = OUTPUT_H;
  const ctx = canvas.getContext("2d")!;
  const scaleX = img.naturalWidth / img.width;
  const scaleY = img.naturalHeight / img.height;
  ctx.drawImage(
    img,
    crop.x * scaleX,
    crop.y * scaleY,
    crop.width * scaleX,
    crop.height * scaleY,
    0,
    0,
    OUTPUT_W,
    OUTPUT_H,
  );
  return canvas.toDataURL("image/jpeg", 0.85);
}

/* ---- crop dialog (controlled externally) ---- */

interface PhotoCropDialogProps {
  src: string | null;
  onApply: (dataUrl: string) => void;
  onClose: () => void;
  language: ResumeLanguage;
}

export function PhotoCropDialog({ src, onApply, onClose, language }: PhotoCropDialogProps) {
  const imgRef = useRef<HTMLImageElement>(null);
  const [crop, setCrop] = useState<Crop>();
  const [completedCrop, setCompletedCrop] = useState<PixelCrop>();
  const zh = language === "zh";

  function onImageLoad(e: React.SyntheticEvent<HTMLImageElement>) {
    const { width, height } = e.currentTarget;
    setCrop(centerAspectCrop(width, height));
    setCompletedCrop(undefined);
  }

  async function handleApply() {
    if (!imgRef.current || !completedCrop) return;
    const dataUrl = await extractCrop(imgRef.current, completedCrop);
    onApply(dataUrl);
  }

  return (
    <Dialog open={!!src} onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>{zh ? "裁剪照片" : "Crop Photo"}</DialogTitle>
        </DialogHeader>

        {src && (
          <div className="flex justify-center overflow-hidden rounded">
            <ReactCrop
              crop={crop}
              onChange={(c) => setCrop(c)}
              onComplete={(c) => setCompletedCrop(c)}
              aspect={PHOTO_ASPECT}
              minWidth={50}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                ref={imgRef}
                src={src}
                alt=""
                style={{ maxHeight: "360px", maxWidth: "100%", display: "block" }}
                onLoad={onImageLoad}
              />
            </ReactCrop>
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            {zh ? "取消" : "Cancel"}
          </Button>
          <Button
            variant="outline"
            className="btn-hover-primary cursor-pointer"
            onClick={handleApply}
            disabled={!completedCrop}
          >
            {zh ? "应用" : "Apply"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
