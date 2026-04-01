"use client";

import { useRef, useState } from "react";
import ReactCrop, {
  centerCrop,
  makeAspectCrop,
  type Crop,
  type PixelCrop,
} from "react-image-crop";
import "react-image-crop/dist/ReactCrop.css";
import { Camera, X } from "lucide-react";
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

const PHOTO_ASPECT = 4 / 5; // width : height (portrait)
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

/* ---- component ---- */

interface PhotoUploadProps {
  photo?: string;
  onChange: (photo: string | undefined) => void;
  language: ResumeLanguage;
}

export function PhotoUpload({ photo, onChange, language }: PhotoUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);
  const [srcFile, setSrcFile] = useState<string | null>(null);
  const [crop, setCrop] = useState<Crop>();
  const [completedCrop, setCompletedCrop] = useState<PixelCrop>();
  const zh = language === "zh";

  function openFilePicker() {
    fileInputRef.current?.click();
  }

  function onFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      setSrcFile(reader.result as string);
      setCrop(undefined);
      setCompletedCrop(undefined);
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  }

  function onImageLoad(e: React.SyntheticEvent<HTMLImageElement>) {
    const { width, height } = e.currentTarget;
    setCrop(centerAspectCrop(width, height));
  }

  async function handleApply() {
    if (!imgRef.current || !completedCrop) return;
    const dataUrl = await extractCrop(imgRef.current, completedCrop);
    onChange(dataUrl);
    setSrcFile(null);
  }

  function handleCancel() {
    setSrcFile(null);
  }

  return (
    <>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={onFileChange}
      />

      <div className="mb-4">
        <label className="mb-1.5 block text-sm font-medium">
          {zh ? "证件照" : "Photo"}
          <span className="ml-1 text-xs font-normal text-muted-foreground">
            {zh ? "（可选）" : "(optional)"}
          </span>
        </label>

        {photo ? (
          <div className="flex items-center gap-3">
            <img
              src={photo}
              alt=""
              className="h-[60px] w-[48px] rounded object-cover ring-1 ring-border"
            />
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="cursor-pointer text-xs"
                onClick={openFilePicker}
              >
                <Camera className="mr-1.5 size-3" />
                {zh ? "更换照片" : "Change"}
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="cursor-pointer text-xs text-muted-foreground hover:text-destructive"
                onClick={() => onChange(undefined)}
              >
                <X className="mr-1 size-3" />
                {zh ? "删除" : "Remove"}
              </Button>
            </div>
          </div>
        ) : (
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="cursor-pointer gap-2 text-xs text-muted-foreground"
            onClick={openFilePicker}
          >
            <Camera className="size-3" />
            {zh ? "上传照片" : "Upload Photo"}
          </Button>
        )}
      </div>

      <Dialog open={!!srcFile} onOpenChange={(open) => { if (!open) handleCancel(); }}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>{zh ? "裁剪照片" : "Crop Photo"}</DialogTitle>
          </DialogHeader>

          {srcFile && (
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
                  src={srcFile}
                  alt=""
                  style={{ maxHeight: "360px", maxWidth: "100%", display: "block" }}
                  onLoad={onImageLoad}
                />
              </ReactCrop>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={handleCancel}>
              {zh ? "取消" : "Cancel"}
            </Button>
            <Button onClick={handleApply} disabled={!completedCrop}>
              {zh ? "应用" : "Apply"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
