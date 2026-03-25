/* ------------------------------------------------------------------ */
/*  Resume data types – shared across the entire project              */
/*  Matches the `content` JSONB column in the `resumes` table         */
/* ------------------------------------------------------------------ */

export interface PersonalInfo {
  fullName: string;
  email: string;
  phone: string;
  location: string;
  website: string;
  linkedin: string;
  summary: string;
}

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

export interface EducationItem {
  id: string;
  institution: string;
  degree: string;
  field: string;
  location: string;
  startDate: string;
  endDate: string;
  gpa: string;
  description: string;
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
