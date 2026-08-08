import { describe, expect, it, vi } from "vitest";
import {
  EXPORT_CAPTURE_PIXEL_RATIO,
  EXPORT_MAX_BYTES_PER_PAGE,
  EXPORT_PREFERRED_BYTES_PER_PAGE,
  PNG_ENCODING_PROFILES,
  selectExportEncoding,
  type ExportEncodingProfile,
} from "@/lib/export-compression";

describe("selectExportEncoding", () => {
  const profiles: ExportEncodingProfile[] = [
    { scale: 1, quality: 0.84 },
    { scale: 0.75, quality: 0.8 },
    { scale: 0.5, quality: 0.76 },
  ];

  it("keeps the clearest encoding that meets the preferred size", async () => {
    const encode = vi.fn(async (profile: ExportEncodingProfile) => ({
      value: profile.scale,
      size: profile.scale === 1 ? 1_200_000 : 800_000,
    }));

    const result = await selectExportEncoding(profiles, 1_000_000, 2_000_000, encode);

    expect(result.value).toBe(0.75);
    expect(result.size).toBe(800_000);
    expect(result.profile).toBe(profiles[1]);
    expect(encode).toHaveBeenCalledTimes(2);
  });

  it("returns the smallest valid encoding when the preferred size is unavailable", async () => {
    const sizes = new Map([
      [1, 1_800_000],
      [0.75, 1_400_000],
      [0.5, 1_600_000],
    ]);

    const result = await selectExportEncoding(
      profiles,
      1_000_000,
      2_000_000,
      async (profile) => ({ value: profile.scale, size: sizes.get(profile.scale) ?? 3_000_000 }),
    );

    expect(result.value).toBe(0.75);
    expect(result.size).toBe(1_400_000);
  });

  it("rejects output that cannot meet the hard size limit", async () => {
    await expect(selectExportEncoding(
      profiles,
      1_000_000,
      2_000_000,
      async (profile) => ({ value: profile.scale, size: 2_100_000 }),
    )).rejects.toThrow("Unable to compress export below the size limit");
  });
});

describe("export compression defaults", () => {
  it("targets one megabyte and caps each page at two megabytes", () => {
    expect(EXPORT_PREFERRED_BYTES_PER_PAGE).toBe(1_000_000);
    expect(EXPORT_MAX_BYTES_PER_PAGE).toBe(2_000_000);
  });

  it("starts PNG output at an effective 1.5 pixel ratio", () => {
    expect(EXPORT_CAPTURE_PIXEL_RATIO * PNG_ENCODING_PROFILES[0].scale).toBe(1.5);
  });
});
