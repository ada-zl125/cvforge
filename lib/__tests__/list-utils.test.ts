import { describe, expect, it } from "vitest";
import { moveItem, removeItemAt, updateItemAt } from "@/lib/list-utils";

describe("list utils", () => {
  it("updates only the requested item", () => {
    const items = [{ name: "A" }, { name: "B" }];

    expect(updateItemAt(items, 1, (item) => ({ ...item, name: "C" }))).toEqual([
      { name: "A" },
      { name: "C" },
    ]);
  });

  it("removes and moves items by index", () => {
    const items = ["A", "B", "C"];

    expect(removeItemAt(items, 1)).toEqual(["A", "C"]);
    expect(moveItem(items, 1, -1)).toEqual(["B", "A", "C"]);
    expect(moveItem(items, 0, -1)).toBe(items);
  });
});

