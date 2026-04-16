import type { ResumeContent, ResumeLanguage } from "./types/resume";

export const RESUME_STORAGE_KEY = "easycv_resume";
export const ACADEMIC_CV_STORAGE_KEY = "easycv_academic";
export const TITLE_MAX = 50;

export const defaultResumeContent: ResumeContent = {
  personal: { fullName: "", contacts: [] },
  sections: [],
  experience: [],
  education: [],
  skills: [],
  projects: [],
  awards: [],
};

/* ---- Date helpers used by section form components ---- */

const EN_MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"] as const;

/** Returns a formatted date string for the current month ± yearsOffset years. */
export function defaultDate(lang: ResumeLanguage, yearsOffset = 0): string {
  const d = new Date();
  d.setFullYear(d.getFullYear() + yearsOffset);
  if (lang === "zh") return `${d.getFullYear()}/${String(d.getMonth() + 1).padStart(2, "0")}`;
  return `${EN_MONTHS[d.getMonth()]} ${d.getFullYear()}`;
}
