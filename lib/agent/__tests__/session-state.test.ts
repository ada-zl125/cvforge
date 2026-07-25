import { beforeEach, describe, expect, it } from "vitest";
import {
  createInitialAgentPanelState,
  readAgentPanelSessionState,
  writeAgentPanelSessionState,
} from "@/lib/agent/session-state";

describe("agent session state", () => {
  beforeEach(() => {
    sessionStorage.clear();
  });

  it("falls back to the initial state for broken storage", () => {
    sessionStorage.setItem("agent", "{bad json");

    expect(readAgentPanelSessionState("agent")).toEqual(createInitialAgentPanelState());
  });

  it("writes and reads safe session fields", () => {
    const state = createInitialAgentPanelState();
    const nextState = {
      ...state,
      messages: [{ role: "user" as const, content: "Polish this" }],
      contextInstruction: "Keep it concise.",
      contextSources: [{
        id: "source",
        type: "file" as const,
        name: "notes.txt",
        text: "Useful context",
        createdAt: 1,
      }],
    };

    writeAgentPanelSessionState("agent", nextState);

    expect(readAgentPanelSessionState("agent")).toMatchObject({
      messages: [{ role: "user", content: "Polish this" }],
      contextInstruction: "Keep it concise.",
      contextSources: [{ name: "notes.txt", text: "Useful context" }],
    });
  });

  it("filters invalid context sources from saved state", () => {
    sessionStorage.setItem("agent", JSON.stringify({
      contextSources: [
        { id: "valid", type: "file", name: "notes.txt", text: "Useful context", createdAt: 1 },
        { id: "invalid", type: "file", name: "broken.txt", createdAt: 2 },
      ],
    }));

    expect(readAgentPanelSessionState("agent").contextSources).toEqual([
      { id: "valid", type: "file", name: "notes.txt", text: "Useful context", createdAt: 1 },
    ]);
  });

  it("keeps separate agent sessions isolated by storage key", () => {
    const state = createInitialAgentPanelState();

    writeAgentPanelSessionState("agent_resume", {
      ...state,
      messages: [{ role: "user", content: "Polish resume" }],
    });
    writeAgentPanelSessionState("agent_cover_letter", {
      ...state,
      messages: [{ role: "user", content: "Polish letter" }],
    });

    expect(readAgentPanelSessionState("agent_resume").messages[0].content).toBe("Polish resume");
    expect(readAgentPanelSessionState("agent_cover_letter").messages[0].content).toBe("Polish letter");
  });

});
