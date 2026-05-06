/* A4 page layout constants shared by all PreviewPanels and PageBreakAvoid */

export const PAGE_W = 794;                    // 210 mm at 96 DPI
export const PAGE_H = 1123;                   // 297 mm at 96 DPI
export const TOP = 32;                         // top visible offset per page window
export const BOTTOM = 48;                      // bottom margin (clipped by window)
export const CONTENT_H = PAGE_H - TOP - BOTTOM; // 1043 — usable height per page
