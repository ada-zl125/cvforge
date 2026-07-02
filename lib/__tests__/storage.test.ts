import { beforeEach, describe, expect, it } from "vitest";
import { readEditorState, writeEditorState } from "@/lib/storage";

interface TestState {
  title: string;
  content: {
    fullName: string;
    contacts: string[];
  };
  hydrated?: boolean;
}

describe("editor storage", () => {
  beforeEach(() => {
    sessionStorage.clear();
  });

  it("returns null for missing or broken editor state", () => {
    sessionStorage.setItem("broken", "{bad json");

    expect(readEditorState<TestState, TestState["content"]>("missing", { fullName: "", contacts: [] })).toBeNull();
    expect(readEditorState<TestState, TestState["content"]>("broken", { fullName: "", contacts: [] })).toBeNull();
  });

  it("merges saved content with default content on read", () => {
    sessionStorage.setItem("resume", JSON.stringify({
      title: "Resume",
      content: { fullName: "Ada Lovelace" },
      hydrated: true,
    }));

    expect(readEditorState<TestState, TestState["content"]>("resume", {
      fullName: "",
      contacts: [],
    })).toEqual({
      title: "Resume",
      content: { fullName: "Ada Lovelace", contacts: [] },
      hydrated: true,
    });
  });

  it("writes independent editor states by key", () => {
    writeEditorState("resume", { title: "Resume", content: { fullName: "Ada" } });
    writeEditorState("cover-letter", { title: "Letter", content: { fullName: "Grace" } });

    expect(JSON.parse(sessionStorage.getItem("resume") ?? "{}").title).toBe("Resume");
    expect(JSON.parse(sessionStorage.getItem("cover-letter") ?? "{}").title).toBe("Letter");
  });
});
