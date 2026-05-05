import type { ResumeContent } from "@/lib/types/resume";
import type { AcademicCVContent } from "@/lib/types/academic-cv";
import type { CoverLetterContent } from "@/lib/types/cover-letter";
import { withId } from "@/lib/json-utils";
import type { DocType } from "./tools";

type AnyContent = ResumeContent | AcademicCVContent | CoverLetterContent;

function ensureUUIDs<T extends { id?: string }>(items: T[]): T[] {
  return withId<T>(items);
}

export function executeToolCall(
  docType: DocType,
  content: unknown,
  toolName: string,
  args: unknown
): unknown {
  if (docType === "resume") {
    return executeResumeToolCall(content as ResumeContent, toolName, args);
  } else if (docType === "academic-cv") {
    return executeAcademicToolCall(content as AcademicCVContent, toolName, args);
  } else if (docType === "cover-letter") {
    return executeCoverLetterToolCall(content as CoverLetterContent, toolName, args);
  }
  return content;
}

function executeResumeToolCall(content: ResumeContent, toolName: string, args: unknown): ResumeContent {
  switch (toolName) {
    case "update_personal": {
      const arg = args as { fullName?: string; email?: string; phone?: string; location?: string; website?: string };
      return {
        ...content,
        personal: {
          ...content.personal,
          fullName: arg.fullName ?? content.personal.fullName,
          contacts: content.personal.contacts.map((c) => {
            if (c.type === "email" && arg.email) return { ...c, value: arg.email };
            if (c.type === "phone" && arg.phone) return { ...c, value: arg.phone };
            if (c.type === "location" && arg.location) return { ...c, value: arg.location };
            if (c.type === "website" && arg.website) return { ...c, value: arg.website };
            return c;
          }),
        },
      };
    }
    case "set_summary": {
      const arg = args as { text: string };
      return { ...content, summary: arg.text ?? "" };
    }
    case "set_experience": {
      const arg = args as { items: Array<{ id?: string; company: string; position: string; location: string; startDate: string; endDate: string; descriptions: Array<{ id?: string; value: string }> }> };
      return { ...content, experience: ensureUUIDs(arg.items ?? []) as typeof content.experience };
    }
    case "set_education": {
      const arg = args as { items: Array<{ id?: string; institution: string; degree: string; field?: string; location: string; startDate: string; endDate: string; extraFields?: Array<{ id?: string; type: "grade" | "awards" | "custom"; label: string; value: string }> }> };
      return {
        ...content,
        education: ensureUUIDs(
          (arg.items ?? []).map((e) => ({
            ...e,
            extraFields: ensureUUIDs(e.extraFields ?? []),
          }))
        ) as typeof content.education,
      };
    }
    case "set_skills": {
      const arg = args as { items: Array<{ id?: string; category: string; items: string }> };
      return { ...content, skills: ensureUUIDs(arg.items ?? []) as typeof content.skills };
    }
    case "set_projects": {
      const arg = args as { items: Array<{ id?: string; name: string; websiteLabel?: string; websiteUrl?: string; startDate: string; endDate: string; descriptions: Array<{ id?: string; value: string }> }> };
      return {
        ...content,
        projects: ensureUUIDs(
          (arg.items ?? []).map((p) => ({
            ...p,
            descriptions: ensureUUIDs(p.descriptions ?? []),
          }))
        ) as typeof content.projects,
      };
    }
    case "set_awards": {
      const arg = args as { items: Array<{ id?: string; award: string; date: string }> };
      return { ...content, awards: ensureUUIDs(arg.items ?? []) as typeof content.awards };
    }
    case "set_sections": {
      const arg = args as { sections: Array<"summary" | "education" | "projects" | "experience" | "skills" | "awards"> };
      return { ...content, sections: arg.sections ?? [] };
    }
    default:
      return content;
  }
}

function executeAcademicToolCall(content: AcademicCVContent, toolName: string, args: unknown): AcademicCVContent {
  switch (toolName) {
    case "update_personal": {
      const arg = args as { fullName?: string; email?: string; phone?: string; location?: string; website?: string };
      return {
        ...content,
        personal: {
          ...content.personal,
          fullName: arg.fullName ?? content.personal.fullName,
          contacts: content.personal.contacts.map((c) => {
            if (c.type === "email" && arg.email) return { ...c, value: arg.email };
            if (c.type === "phone" && arg.phone) return { ...c, value: arg.phone };
            if (c.type === "website" && arg.website) return { ...c, value: arg.website };
            return c;
          }),
        },
      };
    }
    case "set_research_interests": {
      const arg = args as { text: string };
      return { ...content, researchInterests: arg.text ?? "" };
    }
    case "set_education": {
      const arg = args as { items: Array<{ id?: string; institution: string; degree: string; field?: string; location: string; startDate: string; endDate: string; extraFields?: Array<{ id?: string; type: "grade" | "researchField" | "awards" | "custom"; label: string; value: string }> }> };
      return {
        ...content,
        education: ensureUUIDs(
          (arg.items ?? []).map((e) => ({
            ...e,
            extraFields: ensureUUIDs(e.extraFields ?? []),
          }))
        ) as typeof content.education,
      };
    }
    case "set_research_experience": {
      const arg = args as { items: Array<{ id?: string; organization: string; role: string; researchGroup?: string; department?: string; location: string; startDate: string; endDate: string; descriptions?: Array<{ id?: string; value: string }> }> };
      return {
        ...content,
        researchExperience: ensureUUIDs(
          (arg.items ?? []).map((e) => ({
            ...e,
            descriptions: ensureUUIDs(e.descriptions ?? []),
          }))
        ) as typeof content.researchExperience,
      };
    }
    case "set_teaching_experience": {
      const arg = args as { items: Array<{ id?: string; institution: string; role: string; location: string; startDate: string; endDate: string; course?: string; descriptions?: Array<{ id?: string; value: string }> }> };
      return {
        ...content,
        teachingExperience: ensureUUIDs(
          (arg.items ?? []).map((e) => ({
            ...e,
            descriptions: ensureUUIDs(e.descriptions ?? []),
          }))
        ) as typeof content.teachingExperience,
      };
    }
    case "set_industry_experience": {
      const arg = args as { items: Array<{ id?: string; organization: string; role: string; department?: string; location: string; startDate: string; endDate: string; descriptions?: Array<{ id?: string; value: string }> }> };
      return {
        ...content,
        industryExperience: ensureUUIDs(
          (arg.items ?? []).map((e) => ({
            ...e,
            descriptions: ensureUUIDs(e.descriptions ?? []),
          }))
        ) as typeof content.industryExperience,
      };
    }
    case "set_publications": {
      const arg = args as { items: Array<{ id?: string; citation: string }> };
      return { ...content, publications: ensureUUIDs(arg.items ?? []) as typeof content.publications };
    }
    case "set_manuscripts_under_review": {
      const arg = args as { items: Array<{ id?: string; citation: string }> };
      return { ...content, manuscriptsUnderReview: ensureUUIDs(arg.items ?? []) as typeof content.manuscriptsUnderReview };
    }
    case "set_conference_presentations": {
      const arg = args as { items: Array<{ id?: string; event: string; title: string; location: string; date: string; type?: string }> };
      return { ...content, conferencePresentations: ensureUUIDs(arg.items ?? []) as typeof content.conferencePresentations };
    }
    case "set_grants_and_awards": {
      const arg = args as { items: Array<{ id?: string; title: string; date: string }> };
      return { ...content, grantsAndAwards: ensureUUIDs(arg.items ?? []) as typeof content.grantsAndAwards };
    }
    case "set_professional_service": {
      const arg = args as { items: Array<{ id?: string; role: string; organization: string; date: string }> };
      return { ...content, professionalService: ensureUUIDs(arg.items ?? []) as typeof content.professionalService };
    }
    case "set_technical_skills": {
      const arg = args as { items: Array<{ id?: string; category: string; items: string }> };
      return { ...content, technicalSkills: ensureUUIDs(arg.items ?? []) as typeof content.technicalSkills };
    }
    case "set_references": {
      const arg = args as { items: Array<{ id?: string; name: string; title?: string; relationship?: string; address?: string; phone?: string; email?: string }> };
      return { ...content, references: ensureUUIDs(arg.items ?? []) as typeof content.references };
    }
    case "set_sections": {
      const arg = args as { sections: Array<"researchInterests" | "education" | "researchExperience" | "teachingExperience" | "industryExperience" | "publications" | "manuscriptsUnderReview" | "conferencePresentations" | "grantsAndAwards" | "professionalService" | "technicalSkills" | "references"> };
      return { ...content, sections: arg.sections ?? [] };
    }
    default:
      return content;
  }
}

function executeCoverLetterToolCall(content: CoverLetterContent, toolName: string, args: unknown): CoverLetterContent {
  switch (toolName) {
    case "update_sender": {
      const arg = args as { name?: string; address?: Array<{ id?: string; value: string }> };
      return {
        ...content,
        sender: {
          name: arg.name ?? content.sender.name,
          addressLines: (arg.address ? ensureUUIDs(arg.address) : content.sender.addressLines) as typeof content.sender.addressLines,
        },
      };
    }
    case "update_recipient": {
      const arg = args as { name?: string; salutation?: string; address?: Array<{ id?: string; value: string }> };
      return {
        ...content,
        recipient: {
          name: arg.name ?? content.recipient.name,
          salutation: arg.salutation ?? content.recipient.salutation,
          addressLines: (arg.address ? ensureUUIDs(arg.address) : content.recipient.addressLines) as typeof content.recipient.addressLines,
        },
      };
    }
    case "set_paragraphs": {
      const arg = args as { items: Array<{ id?: string; text: string }> };
      return { ...content, paragraphs: ensureUUIDs(arg.items ?? []) as typeof content.paragraphs };
    }
    case "set_date": {
      const arg = args as { date: string };
      return { ...content, date: arg.date ?? content.date };
    }
    default:
      return content;
  }
}
