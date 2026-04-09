/* ------------------------------------------------------------------ */
/*  Resume data types – shared across the entire project              */
/*  Matches the `content` JSONB column in the `resumes` table         */
/* ------------------------------------------------------------------ */

/* ---- Contact field (dynamic, user-addable/removable) ---- */

export type ContactFieldType = "email" | "phone" | "location" | "website";

export interface ContactField {
  id: string;
  type: ContactFieldType;
  value: string;
  /** Phone country code, e.g. "+44" */
  countryCode?: string;
  /** Website display name (clickable label) */
  label?: string;
}

export interface PersonalInfo {
  fullName: string;
  contacts: ContactField[];
  /** Base64 JPEG data URL of the headshot photo (optional) */
  photo?: string;
}

/* ---- Section ordering ---- */

export type SectionType = "education" | "projects" | "experience" | "skills" | "awards";

export interface DescriptionField {
  id: string;
  value: string;
}

export interface ExperienceItem {
  id: string;
  company: string;
  position: string;
  location: string;
  startDate: string;
  endDate: string;
  descriptions: DescriptionField[];
}

export type EducationExtraFieldType = "grade" | "awards" | "custom";

export interface EducationExtraField {
  id: string;
  type: EducationExtraFieldType;
  /** Display label — auto-set for grade/awards, user-defined for custom */
  label: string;
  value: string;
}

export interface EducationItem {
  id: string;
  institution: string;
  degree: string;
  field: string;
  location: string;
  startDate: string;
  endDate: string;
  extraFields: EducationExtraField[];
}

export interface AwardItem {
  id: string;
  award: string;
  date: string;
}

export interface SkillGroup {
  id: string;
  category: string;
  /** Raw comma-separated skills string — stored as-is, split only for preview rendering */
  items: string;
}

export interface ProjectItem {
  id: string;
  name: string;
  websiteLabel: string;
  websiteUrl: string;
  startDate: string;
  endDate: string;
  descriptions: DescriptionField[];
}

export interface ResumeContent {
  personal: PersonalInfo;
  /** Ordered list of active sections (user-addable/removable) */
  sections: SectionType[];
  experience: ExperienceItem[];
  education: EducationItem[];
  skills: SkillGroup[];
  projects: ProjectItem[];
  awards: AwardItem[];
}

/* ------------------------------------------------------------------ */
/*  Database row type – matches the `resumes` table schema             */
/* ------------------------------------------------------------------ */

export type ResumeTemplate =
  | "general";

export type ResumeLanguage = "en" | "zh";

export interface ResumeRow {
  id: string;
  user_id: string;
  title: string;
  template: ResumeTemplate;
  language: ResumeLanguage;
  content: ResumeContent;
  created_at: string;
  updated_at: string;
}
