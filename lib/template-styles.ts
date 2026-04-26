/**
 * Typography constants, CSS style objects, and pure style helpers shared by
 * GeneralTemplate and AcademicTemplate. No JSX — safe to import from .ts files.
 */

import type { ResumeLanguage } from "./types/resume";

/* ---- Fonts ---- */

export const FONT_EN = "'Times New Roman', 'TeX Gyre Termes', serif";
export const FONT_ZH = "'Times New Roman', 'TeX Gyre Termes', 'Songti SC', SimSun, serif";

/* ---- Font sizes ---- */

export const BODY_SIZE = "11pt";
export const SECTION_TITLE_SIZE = "12pt";
export const NAME_SIZE = "20pt";

/* ---- Shared CSS style objects ---- */

export const LINE_STYLE: React.CSSProperties = {
  fontSize: BODY_SIZE,
  fontWeight: 500,
  color: "#000",
  lineHeight: "13pt",
  marginTop: "0.15pt",
  marginBottom: 0,
  paddingLeft: "0.2cm",
  paddingRight: 0,
  letterSpacing: "-0.01em",
};

export const BULLET_ROW_STYLE: React.CSSProperties = {
  fontSize: BODY_SIZE,
  fontWeight: 500,
  color: "#000",
  lineHeight: "13pt",
  marginTop: "0.15pt",
  marginBottom: 0,
  display: "flex",
  alignItems: "baseline",
  letterSpacing: "-0.01em",
};

export const BULLET_DOT_STYLE: React.CSSProperties = {
  marginLeft: "0.2cm",
  width: "0.4cm",
  flexShrink: 0,
  lineHeight: "13pt",
};

/* ---- Helper functions ---- */

export function getFontFamily(lang: ResumeLanguage): string {
  return lang === "zh" ? FONT_ZH : FONT_EN;
}

export function boldFontStyle(lang: ResumeLanguage, fontFamily: string): React.CSSProperties {
  return {
    fontFamily: lang === "zh" ? FONT_ZH : fontFamily,
    fontWeight: lang === "zh" ? 900 : 700,
  };
}
