import { z } from "zod";
import { tool, ToolMessage, type ToolRuntime } from "langchain";
import {
  Command,
  ReducedValue,
  StateSchema,
  interrupt,
} from "@langchain/langgraph";
import type { DynamicStructuredTool } from "@langchain/core/tools";
import type { ResumeContent } from "@/lib/types/resume";
import type { AcademicCVContent } from "@/lib/types/academic-cv";
import type { CoverLetterContent } from "@/lib/types/cover-letter";
import { normalizeToolArgsForDocumentLanguage } from "@/lib/agent/text-normalization";
import { executeToolCall } from "./executor";

export type DocType = "resume" | "academic-cv" | "cover-letter";
export type DocumentLanguage = "en" | "zh";

type AnyContent = ResumeContent | AcademicCVContent | CoverLetterContent;

export interface ClarificationRequest {
  question: string;
  reason: string;
  field?: string;
  section?: string;
  choices?: string[];
}

export interface AgentToolState<TContent = AnyContent> {
  document: TContent;
  successfulToolNames: string[];
  inferenceNotes: string[];
  clarificationCount: number;
}

export interface AgentClarificationScope {
  allowAskUser: boolean;
  section?: string;
}

export interface ClarificationInterrupt {
  type: "cvforge_clarification";
  request: ClarificationRequest;
}

const documentMutationSchema = z.object({
  docType: z.enum(["resume", "academic-cv", "cover-letter"]),
  toolName: z.string(),
  args: z.unknown(),
});

type DocumentMutation = z.infer<typeof documentMutationSchema>;

function isDocumentMutation(value: unknown): value is DocumentMutation {
  return documentMutationSchema.safeParse(value).success;
}

const stringListUpdateSchema = z.discriminatedUnion("operation", [
  z.object({
    operation: z.literal("append"),
    value: z.string(),
  }),
  z.object({
    operation: z.literal("reset"),
  }),
]);

const counterUpdateSchema = z.discriminatedUnion("operation", [
  z.object({
    operation: z.literal("increment"),
    value: z.number().int().nonnegative(),
  }),
  z.object({
    operation: z.literal("set"),
    value: z.number().int().nonnegative(),
  }),
]);

export const agentContextSchema = z.object({
  contextInstruction: z.string().optional(),
  referencePaths: z.array(z.string()).default([]),
  currentDocument: z.unknown(),
  clarificationScope: z.object({
    allowAskUser: z.boolean(),
    section: z.string().optional(),
  }),
});

export const agentStateSchema = new StateSchema({
  document: new ReducedValue(z.unknown().default(null), {
    inputSchema: z.unknown(),
    reducer: (current, update) =>
      isDocumentMutation(update)
        ? executeToolCall(
            update.docType,
            current,
            update.toolName,
            update.args
          )
        : update,
  }),
  successfulToolNames: new ReducedValue(
    z.array(z.string()).default(() => []),
    {
      inputSchema: stringListUpdateSchema,
      reducer: (current, update) =>
        update.operation === "reset"
          ? []
          : [...current, update.value],
    }
  ),
  inferenceNotes: new ReducedValue(
    z.array(z.string()).default(() => []),
    {
      inputSchema: stringListUpdateSchema,
      reducer: (current, update) =>
        update.operation === "reset"
          ? []
          : [...current, update.value],
    }
  ),
  clarificationCount: new ReducedValue(
    z.number().int().nonnegative().default(0),
    {
      inputSchema: counterUpdateSchema,
      reducer: (current, update) =>
        update.operation === "set"
          ? update.value
          : current + update.value,
    }
  ),
});

type CVForgeToolRuntime = ToolRuntime<
  typeof agentStateSchema,
  typeof agentContextSchema
>;

const MAX_CLARIFICATION_ROUNDS = 2;

function toolMessage(toolCallId: string, content: string, name: string): ToolMessage {
  return new ToolMessage({
    content,
    name,
    tool_call_id: toolCallId,
  });
}

export function createTools(
  docType: DocType,
  documentLanguage: DocumentLanguage
): DynamicStructuredTool[] {
  const tools: DynamicStructuredTool[] = [];

  function makeUpdateHandler(toolName: string, argsSchema: z.ZodObject) {
    return tool(
      async (
        args: unknown,
        runtime: CVForgeToolRuntime
      ) => {
        runtime.signal?.throwIfAborted();
        const normalizedArgs = normalizeToolArgsForDocumentLanguage(args, documentLanguage);
        runtime.signal?.throwIfAborted();

        return new Command({
          update: {
            document: {
              docType,
              toolName,
              args: normalizedArgs,
            },
            successfulToolNames: {
              operation: "append",
              value: toolName,
            },
            messages: [
              toolMessage(runtime.toolCallId, `Updated ${toolName}`, toolName),
            ],
          },
        });
      },
      {
      name: toolName,
      description: getToolDescription(docType, toolName),
      schema: argsSchema,
      },
    );
  }

  tools.push(
    tool(
      async (
        args: ClarificationRequest,
        runtime: CVForgeToolRuntime
      ) => {
        const state = runtime.state as AgentToolState;
        if (state.clarificationCount >= MAX_CLARIFICATION_ROUNDS) {
          return "The clarification limit has been reached. Continue with the safest accurate partial update or ask in normal chat.";
        }

        const request: ClarificationRequest = {
          question:
            args.question.trim() ||
            (documentLanguage === "zh"
              ? "请补充说明这个细节。"
              : "Could you clarify this detail?"),
          reason:
            args.reason.trim() ||
            (documentLanguage === "zh"
              ? "这个细节存在歧义, 不应猜测。"
              : "This detail is ambiguous and should not be guessed."),
          field: args.field?.trim() || undefined,
          section: args.section?.trim() || undefined,
          choices: args.choices?.map((choice) => choice.trim()).filter(Boolean),
        };
        const answer = interrupt<ClarificationInterrupt, string>({
          type: "cvforge_clarification",
          request,
        });

        return new Command({
          update: {
            clarificationCount: {
              operation: "increment",
              value: 1,
            },
            messages: [
              toolMessage(
                runtime.toolCallId,
                `User clarification response: ${answer}`,
                "ask_user"
              ),
            ],
          },
        });
      },
      {
        name: "ask_user",
        description:
          "Ask the user for one focused clarification before continuing a structured document edit. Use this only when a required detail from the user's original task is missing, ambiguous, cannot be safely inferred, and cannot be safely omitted. If the user asked to modify a specific section, the question must stay inside that same section and must not ask about any other section. Do not use this for optional details or general follow-up. Call this tool alone in its model turn.",
        schema: z.object({
        question: z.string().describe("One concise question for the user"),
        reason: z.string().describe("Brief reason why this cannot be safely inferred"),
        field: z.string().optional().describe("Optional field path affected inside the requested scope"),
        section: z.string().optional().describe("Optional requested section affected"),
        choices: z.array(z.string()).optional().describe("Optional short answer choices only when natural; omit when the user should type a custom answer"),
      }),
      }
    ),
    tool(
      async (
        args: {
          original: string;
          inferred: string;
          reason: string;
          field?: string;
        },
        runtime: CVForgeToolRuntime
      ) => {
        const original = args.original.trim() || "unspecified";
        const inferred = args.inferred.trim() || "unspecified";
        const reason = args.reason.trim() || "high-confidence normalization";
        const field = args.field?.trim();
        const note = field
          ? `${field}: "${original}" to "${inferred}" (${reason})`
          : `"${original}" to "${inferred}" (${reason})`;

        return new Command({
          update: {
            inferenceNotes: {
              operation: "append",
              value: note,
            },
            messages: [
              toolMessage(
                runtime.toolCallId,
                `Recorded inference: ${note}. Mention this to the user after document updates.`,
                "record_inference"
              ),
            ],
          },
        });
      },
      {
        name: "record_inference",
        description:
          "Record a high-confidence inference or normalization that will be written to the document. Use before or alongside update tools when filling information the user implied but did not state exactly.",
        schema: z.object({
        original: z.string().describe("The user's original wording or incomplete value"),
        inferred: z.string().describe("The normalized or inferred value that will be written"),
        reason: z.string().describe("Brief reason why this inference is high-confidence and low-risk"),
        field: z.string().optional().describe("Optional field path or section affected"),
      }),
      }
    )
  );

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
              location: optionalKnown("Location formatted consistently with the current document"),
              startDate: optionalKnown("Start date formatted consistently with the current document"),
              endDate: optionalKnown("End date formatted consistently with the current document"),
              descriptions: z.array(
                z.object({
                  id: z.string().optional(),
                  value: z.string().describe("Description text"),
                })
              ),
            })
          ).describe("Experience entries ordered reverse-chronologically: most recent or ongoing role first."),
        })
      ),
      makeUpdateHandler(
        "set_education",
        z.object({
          items: z.array(
            z.object({
              id: z.string().optional(),
              institution: z.string(),
              degree: optionalKnown("Degree title in the document language and established style"),
              field: z.string().optional().describe("Optional field of study when it is not already represented in the degree"),
              location: optionalKnown("Location formatted consistently with the current document"),
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
          ).describe("Education entries ordered reverse-chronologically: most recent or ongoing degree first."),
        })
      ),
      makeUpdateHandler(
        "set_skills",
        z.object({
          items: z.array(
            z.object({
              id: z.string().optional(),
              category: z.string().describe("Short practical category label in the document language"),
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
              websiteLabel: z.string().optional().describe("Short display label for the project link"),
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
          ).describe("Project entries ordered reverse-chronologically: most recent or ongoing project first."),
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
          ).describe("Award entries ordered reverse-chronologically: most recent award first."),
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
          addressLine1: z.string().optional().describe("Academic CV personal address line 1"),
          addressLine2: z.string().optional().describe("Academic CV personal address line 2"),
          addressLine3: z.string().optional().describe("Academic CV personal address line 3"),
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
              degree: optionalKnown("Degree title in the document language and established style"),
              field: z.string().optional().describe("Optional field of study when it is not already represented in the degree"),
              location: optionalKnown("Location formatted consistently with the current document"),
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
          ).describe("Education entries ordered reverse-chronologically: most recent or ongoing degree first."),
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
              location: optionalKnown("Location formatted consistently with the current document"),
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
          ).describe("Research experience entries ordered reverse-chronologically: most recent or ongoing role first."),
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
              location: optionalKnown("Location formatted consistently with the current document"),
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
          ).describe("Teaching experience entries ordered reverse-chronologically: most recent or ongoing role first."),
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
              location: optionalKnown("Location formatted consistently with the current document"),
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
          ).describe("Industry experience entries ordered reverse-chronologically: most recent or ongoing role first."),
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
          ).describe("Publication entries ordered reverse-chronologically when a year is present in the citation."),
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
          ).describe("Manuscript entries ordered reverse-chronologically when a year is present in the citation."),
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
              location: optionalKnown("Location formatted consistently with the current document"),
              date: optionalKnown("Presentation date"),
              type: z.string().optional().describe("Presentation format or participation type"),
            })
          ).describe("Presentation entries ordered reverse-chronologically: most recent presentation first."),
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
          ).describe("Grant and award entries ordered reverse-chronologically: most recent first."),
        })
      ),
      makeUpdateHandler(
        "set_professional_service",
        z.object({
          items: z.array(
            z.object({
              id: z.string().optional(),
              role: z.string().describe("Professional service role"),
              organization: z.string().describe("Organization or venue"),
              date: z.string(),
            })
          ).describe("Professional service entries ordered reverse-chronologically: most recent first."),
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
          date: z.string().describe("Letter date formatted consistently with the current document"),
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
      update_personal: "Update personal information (name, email, phone, address lines, website)",
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
