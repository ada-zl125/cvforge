import { z } from "zod";
import { DynamicStructuredTool } from "@langchain/core/tools";
import type { ResumeContent } from "@/lib/types/resume";
import type { AcademicCVContent } from "@/lib/types/academic-cv";
import type { CoverLetterContent } from "@/lib/types/cover-letter";
import { executeToolCall } from "./executor";

export type DocType = "resume" | "academic-cv" | "cover-letter";

type AnyContent = ResumeContent | AcademicCVContent | CoverLetterContent;

export function createTools<TContent = AnyContent>(
  docType: DocType,
  getContent: () => TContent,
  onUpdate: (updated: TContent, toolName: string) => void
): DynamicStructuredTool[] {
  const tools: DynamicStructuredTool[] = [];

  function makeUpdateHandler(toolName: string, argsSchema: z.ZodSchema) {
    return new DynamicStructuredTool({
      name: toolName,
      description: getToolDescription(docType, toolName),
      schema: argsSchema,
      func: async (args: unknown) => {
        const updated = executeToolCall(docType, getContent(), toolName, args) as TContent;
        onUpdate(updated, toolName);
        return `Updated ${toolName}`;
      },
    });
  }

  const optionalKnown = (description: string) =>
    z.string().optional().describe(`${description}. Omit or use an empty string when unknown; do not invent.`);

  if (docType === "resume") {
    tools.push(
      makeUpdateHandler(
        "update_personal",
        z.object({
          fullName: z.string().optional(),
          email: z.string().optional(),
          phone: z.string().optional(),
          location: z.string().optional(),
          website: z.string().optional(),
        })
      ),
      makeUpdateHandler(
        "set_summary",
        z.object({
          text: z.string().describe("Professional summary text"),
        })
      ),
      makeUpdateHandler(
        "set_experience",
        z.object({
          items: z.array(
            z.object({
              id: z.string().optional(),
              company: z.string(),
              position: optionalKnown("Position/title"),
              location: optionalKnown("Location in project style, e.g. London, UK or 中国, 北京"),
              startDate: optionalKnown("Start date, e.g. Sept 2023 or 2024/09"),
              endDate: optionalKnown("End date, e.g. Present, Aug 2024, or 至今"),
              descriptions: z.array(
                z.object({
                  id: z.string().optional(),
                  value: z.string().describe("Description text"),
                })
              ),
            })
          ),
        })
      ),
      makeUpdateHandler(
        "set_education",
        z.object({
          items: z.array(
            z.object({
              id: z.string().optional(),
              institution: z.string(),
              degree: optionalKnown("Degree, e.g. Bachelor of Science"),
              field: z.string().optional(),
              location: optionalKnown("Location in project style, e.g. Oxford, UK or 中国, 北京"),
              startDate: optionalKnown("Start date"),
              endDate: optionalKnown("End date"),
              extraFields: z
                .array(
                  z.object({
                    id: z.string().optional(),
                    type: z.enum(["grade", "awards", "custom"]),
                    label: z.string(),
                    value: z.string(),
                  })
                )
                .optional(),
            })
          ),
        })
      ),
      makeUpdateHandler(
        "set_skills",
        z.object({
          items: z.array(
            z.object({
              id: z.string().optional(),
              category: z.string().describe("e.g. Tech Stack, Languages"),
              items: z.string().describe("Comma-separated skills"),
            })
          ),
        })
      ),
      makeUpdateHandler(
        "set_projects",
        z.object({
          items: z.array(
            z.object({
              id: z.string().optional(),
              name: z.string(),
              websiteLabel: z.string().optional().describe("e.g. GitHub, Website"),
              websiteUrl: z.string().optional().describe("Full URL"),
              startDate: optionalKnown("Start date"),
              endDate: optionalKnown("End date"),
              descriptions: z.array(
                z.object({
                  id: z.string().optional(),
                  value: z.string(),
                })
              ),
            })
          ),
        })
      ),
      makeUpdateHandler(
        "set_awards",
        z.object({
          items: z.array(
            z.object({
              id: z.string().optional(),
              award: z.string().describe("Award title or description"),
              date: z.string().describe("Date of award"),
            })
          ),
        })
      ),
      makeUpdateHandler(
        "set_sections",
        z.object({
          sections: z.array(
            z.enum(["summary", "education", "projects", "experience", "skills", "awards"])
          ).describe("Ordered list of visible sections"),
        })
      )
    );
  } else if (docType === "academic-cv") {
    tools.push(
      makeUpdateHandler(
        "update_personal",
        z.object({
          fullName: z.string().optional(),
          email: z.string().optional(),
          phone: z.string().optional(),
          location: z.string().optional(),
          website: z.string().optional(),
        })
      ),
      makeUpdateHandler(
        "set_research_interests",
        z.object({
          text: z.string(),
        })
      ),
      makeUpdateHandler(
        "set_education",
        z.object({
          items: z.array(
            z.object({
              id: z.string().optional(),
              institution: z.string(),
              degree: optionalKnown("Degree"),
              field: z.string().optional(),
              location: optionalKnown("Location in project style, e.g. Oxford, UK or 中国, 北京"),
              startDate: optionalKnown("Start date"),
              endDate: optionalKnown("End date"),
              extraFields: z
                .array(
                  z.object({
                    id: z.string().optional(),
                    type: z.enum(["grade", "researchField", "awards", "custom"]),
                    label: z.string(),
                    value: z.string(),
                  })
                )
                .optional(),
            })
          ),
        })
      ),
      makeUpdateHandler(
        "set_research_experience",
        z.object({
          items: z.array(
            z.object({
              id: z.string().optional(),
              organization: z.string(),
              role: optionalKnown("Role/title"),
              researchGroup: z.string().optional(),
              department: z.string().optional(),
              location: optionalKnown("Location in project style, e.g. Oxford, UK or 中国, 北京"),
              startDate: optionalKnown("Start date"),
              endDate: optionalKnown("End date"),
              descriptions: z
                .array(
                  z.object({
                    id: z.string().optional(),
                    value: z.string(),
                  })
                )
                .optional(),
            })
          ),
        })
      ),
      makeUpdateHandler(
        "set_teaching_experience",
        z.object({
          items: z.array(
            z.object({
              id: z.string().optional(),
              institution: z.string(),
              role: optionalKnown("Role/title"),
              location: optionalKnown("Location in project style, e.g. Oxford, UK or 中国, 北京"),
              startDate: optionalKnown("Start date"),
              endDate: optionalKnown("End date"),
              course: z.string().optional(),
              descriptions: z
                .array(
                  z.object({
                    id: z.string().optional(),
                    value: z.string(),
                  })
                )
                .optional(),
            })
          ),
        })
      ),
      makeUpdateHandler(
        "set_industry_experience",
        z.object({
          items: z.array(
            z.object({
              id: z.string().optional(),
              organization: z.string(),
              role: optionalKnown("Role/title"),
              department: z.string().optional(),
              location: optionalKnown("Location in project style, e.g. London, UK or 中国, 北京"),
              startDate: optionalKnown("Start date"),
              endDate: optionalKnown("End date"),
              descriptions: z
                .array(
                  z.object({
                    id: z.string().optional(),
                    value: z.string(),
                  })
                )
                .optional(),
            })
          ),
        })
      ),
      makeUpdateHandler(
        "set_publications",
        z.object({
          items: z.array(
            z.object({
              id: z.string().optional(),
              citation: z.string().describe("Full citation (any format)"),
            })
          ),
        })
      ),
      makeUpdateHandler(
        "set_manuscripts_under_review",
        z.object({
          items: z.array(
            z.object({
              id: z.string().optional(),
              citation: z.string(),
            })
          ),
        })
      ),
      makeUpdateHandler(
        "set_conference_presentations",
        z.object({
          items: z.array(
            z.object({
              id: z.string().optional(),
              event: z.string(),
              title: z.string(),
              location: optionalKnown("Location in project style, e.g. London, UK or 美国, 新奥尔良"),
              date: optionalKnown("Presentation date"),
              type: z.string().optional().describe("e.g. Oral, Poster, Invited"),
            })
          ),
        })
      ),
      makeUpdateHandler(
        "set_grants_and_awards",
        z.object({
          items: z.array(
            z.object({
              id: z.string().optional(),
              title: z.string(),
              date: z.string(),
            })
          ),
        })
      ),
      makeUpdateHandler(
        "set_professional_service",
        z.object({
          items: z.array(
            z.object({
              id: z.string().optional(),
              role: z.string().describe("e.g. Reviewer"),
              organization: z.string().describe("e.g. NeurIPS"),
              date: z.string(),
            })
          ),
        })
      ),
      makeUpdateHandler(
        "set_technical_skills",
        z.object({
          items: z.array(
            z.object({
              id: z.string().optional(),
              category: z.string(),
              items: z.string().describe("Comma-separated"),
            })
          ),
        })
      ),
      makeUpdateHandler(
        "set_references",
        z.object({
          items: z.array(
            z.object({
              id: z.string().optional(),
              name: z.string(),
              title: z.string().optional(),
              relationship: z.string().optional(),
              address: z.string().optional(),
              phone: z.string().optional(),
              email: z.string().optional(),
            })
          ),
        })
      ),
      makeUpdateHandler(
        "set_sections",
        z.object({
          sections: z.array(
            z.enum([
              "researchInterests",
              "education",
              "researchExperience",
              "teachingExperience",
              "industryExperience",
              "publications",
              "manuscriptsUnderReview",
              "conferencePresentations",
              "grantsAndAwards",
              "professionalService",
              "technicalSkills",
              "references",
            ])
          ),
        })
      )
    );
  } else if (docType === "cover-letter") {
    tools.push(
      makeUpdateHandler(
        "update_sender",
        z.object({
          name: z.string().optional(),
          address: z
            .array(
              z.object({
                id: z.string().optional(),
                value: z.string(),
              })
            )
            .optional(),
        })
      ),
      makeUpdateHandler(
        "update_recipient",
        z.object({
          name: z.string().optional(),
          salutation: z.string().optional(),
          address: z
            .array(
              z.object({
                id: z.string().optional(),
                value: z.string(),
              })
            )
            .optional(),
        })
      ),
      makeUpdateHandler(
        "set_paragraphs",
        z.object({
          items: z.array(
            z.object({
              id: z.string().optional(),
              text: z.string(),
            })
          ),
        })
      ),
      makeUpdateHandler(
        "set_date",
        z.object({
          date: z.string().describe("e.g. March 20, 2024"),
        })
      )
    );
  }

  return tools;
}

function getToolDescription(docType: DocType, toolName: string): string {
  const descriptions: Record<string, Record<string, string>> = {
    resume: {
      update_personal: "Update personal information (name, email, phone, location, website)",
      set_summary: "Set or update the professional summary",
      set_experience: "Set work experience entries",
      set_education: "Set education entries",
      set_skills: "Set skill groups",
      set_projects: "Set project entries",
      set_awards: "Set award entries",
      set_sections: "Set which sections are visible and their order",
    },
    "academic-cv": {
      update_personal: "Update personal information (name, email, phone, location, website)",
      set_research_interests: "Set research interests",
      set_education: "Set education entries",
      set_research_experience: "Set research experience entries",
      set_teaching_experience: "Set teaching experience entries",
      set_industry_experience: "Set industry experience entries",
      set_publications: "Set publication entries",
      set_manuscripts_under_review: "Set manuscripts under review",
      set_conference_presentations: "Set conference presentation entries",
      set_grants_and_awards: "Set grants and awards",
      set_professional_service: "Set professional service roles",
      set_technical_skills: "Set technical skill groups",
      set_references: "Set references",
      set_sections: "Set visible sections and their order",
    },
    "cover-letter": {
      update_sender: "Update sender information",
      update_recipient: "Update recipient information",
      set_paragraphs: "Set paragraph content",
      set_date: "Set the letter date",
    },
  };

  return descriptions[docType]?.[toolName] || "Update document";
}
