import { describe, expect, it } from "vitest";
import {
  buildAgentChange,
  canReviewAgentChange,
  canUndoAgentChange,
  contentSignature,
} from "@/lib/agent/change-tracking";

function createChange() {
  const before = { summary: "Before" };
  const after = { summary: "After" };
  const change = buildAgentChange(before, after, ["set_summary"]);
  if (!change) throw new Error("Expected a document change");
  return { before, after, change };
}

describe("agent change guards", () => {
  it("only reviews a stable change matching the current document", () => {
    const { before, after, change } = createChange();

    expect(
      canReviewAgentChange(change, contentSignature(after), true),
    ).toBe(true);
    expect(
      canReviewAgentChange(change, contentSignature(before), true),
    ).toBe(false);
    expect(
      canReviewAgentChange(change, contentSignature(after), false),
    ).toBe(false);
  });

  it("only undoes the latest stable change matching the current document", () => {
    const { after, change } = createChange();
    const otherChange = { ...change, id: "other-change" };
    const signature = contentSignature(after);

    expect(canUndoAgentChange(change, change, signature, true)).toBe(true);
    expect(canUndoAgentChange(change, otherChange, signature, true)).toBe(false);
    expect(canUndoAgentChange(change, change, signature, false)).toBe(false);
  });
});
