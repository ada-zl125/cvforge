import type { ResumeContent, ResumeLanguage } from "./types/resume";
import type { AcademicCVContent } from "./types/academic-cv";
import type { CoverLetterContent } from "./types/cover-letter";

export const RESUME_STORAGE_KEY = "cvforge_resume";
export const ACADEMIC_CV_STORAGE_KEY = "cvforge_academic";
export const COVER_LETTER_STORAGE_KEY = "cvforge_cover_letter";
export const RESUME_AGENT_STORAGE_KEY = "cvforge_agent_resume";
export const ACADEMIC_CV_AGENT_STORAGE_KEY = "cvforge_agent_academic";
export const COVER_LETTER_AGENT_STORAGE_KEY = "cvforge_agent_cover_letter";
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

export const defaultAcademicCVContent: AcademicCVContent = {
  personal: { fullName: "", contacts: [] },
  sections: [],
  education: [],
  researchExperience: [],
  teachingExperience: [],
  industryExperience: [],
  publications: [],
  manuscriptsUnderReview: [],
  conferencePresentations: [],
  grantsAndAwards: [],
  professionalService: [],
  technicalSkills: [],
  references: [],
};

export const defaultCoverLetterContent: CoverLetterContent = {
  sender: { name: "", addressLines: [] },
  date: "",
  recipient: { name: "", addressLines: [] },
  paragraphs: [],
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
