export const EXPORT_CAPTURE_PIXEL_RATIO = 2;
export const EXPORT_PREFERRED_BYTES_PER_PAGE = 1_000_000;
export const EXPORT_MAX_BYTES_PER_PAGE = 2_000_000;

export interface ExportEncodingProfile {
  scale: number;
  quality?: number;
}

export interface EncodedExport<T> {
  value: T;
  size: number;
  profile: ExportEncodingProfile;
}

export const PNG_ENCODING_PROFILES: readonly ExportEncodingProfile[] = [
  { scale: 0.75 },
  { scale: 0.625 },
  { scale: 0.5 },
  { scale: 0.375 },
  { scale: 0.25 },
  { scale: 0.1875 },
  { scale: 0.125 },
];

export async function selectExportEncoding<T>(
  profiles: readonly ExportEncodingProfile[],
  preferredBytes: number,
  maxBytes: number,
  encode: (profile: ExportEncodingProfile) => Promise<{ value: T; size: number }>,
): Promise<EncodedExport<T>> {
  if (profiles.length === 0) throw new Error("No export encoding profiles available");

  let smallest: EncodedExport<T> | null = null;

  for (const profile of profiles) {
    const encoded = await encode(profile);
    const candidate = { ...encoded, profile };

    if (!smallest || candidate.size < smallest.size) smallest = candidate;
    if (candidate.size <= preferredBytes) return candidate;
  }

  if (smallest && smallest.size <= maxBytes) return smallest;
  throw new Error("Unable to compress export below the size limit");
}

function resizeCanvas(source: HTMLCanvasElement, scale: number): HTMLCanvasElement {
  if (scale === 1) return source;

  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(source.width * scale));
  canvas.height = Math.max(1, Math.round(source.height * scale));

  const context = canvas.getContext("2d");
  if (!context) throw new Error("Export canvas context unavailable");

  context.imageSmoothingEnabled = true;
  context.imageSmoothingQuality = "high";
  context.drawImage(source, 0, 0, canvas.width, canvas.height);
  return canvas;
}

function canvasToBlob(
  canvas: HTMLCanvasElement,
  type: "image/jpeg" | "image/png",
  quality?: number,
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) resolve(blob);
      else reject(new Error("Export image encoding failed"));
    }, type, quality);
  });
}

export async function encodeCanvasWithinBudget(
  source: HTMLCanvasElement,
  type: "image/jpeg" | "image/png",
  profiles: readonly ExportEncodingProfile[],
  preferredBytes: number,
  maxBytes: number,
): Promise<EncodedExport<Blob>> {
  return selectExportEncoding(
    profiles,
    preferredBytes,
    maxBytes,
    async (profile) => {
      const canvas = resizeCanvas(source, profile.scale);
      const blob = await canvasToBlob(canvas, type, profile.quality);
      return { value: blob, size: blob.size };
    },
  );
}
