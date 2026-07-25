import { describe, expect, it } from "vitest";
import { z } from "zod";
import { createTools } from "@/lib/agent/tools";
import { createAgentChatModel } from "@/lib/agent/model";

describe("agent tool schemas", () => {
  it("exposes the expected tool set for each document type", () => {
    const common = ["ask_user", "record_inference"];
    const resumeTools = createTools("resume", "en").map((tool) => tool.name);
    const academicTools = createTools("academic-cv", "en").map(
      (tool) => tool.name
    );
    const coverLetterTools = createTools("cover-letter", "en").map(
      (tool) => tool.name
    );

    expect(resumeTools).toEqual([
      ...common,
      "update_personal",
      "set_summary",
      "set_experience",
      "set_education",
      "set_skills",
      "set_projects",
      "set_awards",
      "set_sections",
    ]);
    expect(academicTools).toEqual([
      ...common,
      "update_personal",
      "set_research_interests",
      "set_education",
      "set_research_experience",
      "set_teaching_experience",
      "set_industry_experience",
      "set_publications",
      "set_manuscripts_under_review",
      "set_conference_presentations",
      "set_grants_and_awards",
      "set_professional_service",
      "set_technical_skills",
      "set_references",
      "set_sections",
    ]);
    expect(coverLetterTools).toEqual([
      ...common,
      "update_sender",
      "update_recipient",
      "set_paragraphs",
      "set_date",
    ]);
  });

  it("preserves nested OpenAI function schema details", () => {
    const experienceTool = createTools("resume", "en").find(
      (tool) => tool.name === "set_experience"
    );

    expect(experienceTool).toBeDefined();
    const schema = z.toJSONSchema(experienceTool!.schema as z.ZodType);
    const properties = schema.properties as Record<string, unknown>;
    const items = properties.items as {
      items?: {
        properties?: Record<string, unknown>;
      };
    };
    const experienceProperties = items.items?.properties;

    expect(experienceProperties).toHaveProperty("company");
    expect(experienceProperties).toHaveProperty("position");
    expect(experienceProperties).toHaveProperty("descriptions");
  });

  it("keeps tool guidance semantic and free of case examples", () => {
    const schemas = (
      ["resume", "academic-cv", "cover-letter"] as const
    ).flatMap((docType) =>
      createTools(docType, "en").map(
        (agentTool) =>
          `${agentTool.description}\n${JSON.stringify(
            z.toJSONSchema(agentTool.schema as z.ZodType)
          )}`
      )
    );

    expect(schemas.join("\n")).not.toMatch(/\be\.g\.|\bfor example\b|\bsuch as\b/i);
  });

  it("rejects invalid tool arguments before execution", async () => {
    const skillsTool = createTools("resume", "en").find(
      (tool) => tool.name === "set_skills"
    );

    await expect(
      skillsTool!.invoke({
        items: "TypeScript",
      } as never)
    ).rejects.toThrow("expected array");
  });
});

describe("OpenAI compatible model configuration", () => {
  it("uses Chat Completions with serial OpenAI tool calls", () => {
    const model = createAgentChatModel({
      apiKey: "test-key",
      baseURL: "https://example.test/v1/",
      model: "gpt-4.1-mini",
    });
    const params = model.invocationParams();

    expect(model.useResponsesApi).toBe(false);
    expect(params.parallel_tool_calls).toBe(false);
  });
});
