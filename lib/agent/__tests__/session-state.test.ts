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
});

