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
}

/* ---- Section ordering ---- */

export type SectionType = "education" | "projects" | "experience" | "skills";

export interface ExperienceItem {
  id: string;
  company: string;
  position: string;
  location: string;
  startDate: string;
  endDate: string;
  current: boolean;
  description: string;
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

export interface SkillGroup {
  id: string;
  category: string;
  items: string[];
}

export interface ProjectItem {
  id: string;
  name: string;
  url: string;
  startDate: string;
  endDate: string;
  description: string;
  technologies: string[];
}

export interface ResumeContent {
  personal: PersonalInfo;
  /** Ordered list of active sections (user-addable/removable) */
  sections: SectionType[];
  experience: ExperienceItem[];
  education: EducationItem[];
  skills: SkillGroup[];
  projects: ProjectItem[];
}

/* ------------------------------------------------------------------ */
/*  Database row type – matches the `resumes` table schema             */
/* ------------------------------------------------------------------ */

export type ResumeTemplate =
  | "classic"
  | "modern"
  | "minimal"
  | "creative"
  | "professional"
  | "academic";

export interface ResumeRow {
  id: string;
  user_id: string;
  title: string;
  template: ResumeTemplate;
  content: ResumeContent;
  created_at: string;
  updated_at: string;
}
