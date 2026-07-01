import type { AgentChange } from "@/lib/agent/change-tracking";

export interface ReviewSnippet {
  text: string;
  anchors: string[];
}

function getItemId(value: unknown): string | undefined {
  if (!value || typeof value !== "object") return undefined;

  const id = (value as Record<string, unknown>).id;
  return typeof id === "string" ? id : undefined;
}

function formatDateRange(value: unknown): string {
  if (!value || typeof value !== "object") return "";

  const record = value as Record<string, unknown>;
  const startDate = typeof record.startDate === "string" ? record.startDate.trim() : "";
  const endDate = typeof record.endDate === "string" ? record.endDate.trim() : "";
  return [startDate, endDate].filter(Boolean).join(" – ");
}

function collectStrings(value: unknown, parts: string[]): void {
  if (typeof value === "string") {
    const text = value.trim();
    if (text) parts.push(text);
    return;
  }

  if (Array.isArray(value)) {
    value.forEach((item) => collectStrings(item, parts));
    return;
  }

  if (value && typeof value === "object") {
    Object.entries(value).forEach(([key, nested]) => {
      if (key !== "id" && key !== "photo") collectStrings(nested, parts);
    });
  }
}

function stringsFrom(value: unknown): string[] {
  const parts: string[] = [];
  collectStrings(value, parts);
  return parts;
}

function uniqueStrings(values: string[]): string[] {
  return Array.from(new Set(values.map((value) => value.trim()).filter((value) => value.length > 1)));
}

function mergeAnchors(...groups: string[][]): string[] {
  return uniqueStrings(groups.flat())
    .sort((a, b) => b.length - a.length)
    .slice(0, 8);
}

function pushSnippet(snippets: ReviewSnippet[], text: string, anchors: string[]): void {
  const trimmed = text.trim();
  if (trimmed.length <= 1) return;
  snippets.push({
    text: trimmed,
    anchors: mergeAnchors(anchors).filter((anchor) => anchor !== trimmed),
  });
}

function getBeforeArrayItem(beforeItems: unknown[], afterItem: unknown, index: number): unknown {
  const id = getItemId(afterItem);
  if (id) {
    const match = beforeItems.find((item) => getItemId(item) === id);
    if (match) return match;
  }

  return beforeItems[index];
}

function collectChangedDateRanges(
  before: unknown,
  after: unknown,
  snippets: ReviewSnippet[],
  anchors: string[] = [],
): void {
  if (Array.isArray(after)) {
    const beforeItems = Array.isArray(before) ? before : [];
    after.forEach((item, index) => {
      collectChangedDateRanges(getBeforeArrayItem(beforeItems, item, index), item, snippets, anchors);
    });
    return;
  }

  if (!after || typeof after !== "object") return;

  const afterRecord = after as Record<string, unknown>;
  const beforeRecord = before && typeof before === "object" ? before as Record<string, unknown> : {};
  const afterRange = formatDateRange(afterRecord);
  const beforeRange = formatDateRange(beforeRecord);
  if (afterRange && afterRange !== beforeRange) {
    pushSnippet(snippets, afterRange, anchors);
  }

  Object.entries(afterRecord).forEach(([key, value]) => {
    if (key === "id" || key === "photo") return;
    const siblingAnchors = stringsFrom(
      Object.fromEntries(Object.entries(afterRecord).filter(([siblingKey]) => siblingKey !== key))
    );
    collectChangedDateRanges(beforeRecord[key], value, snippets, mergeAnchors(anchors, siblingAnchors));
  });
}

function collectChangedStringLeaves(
  before: unknown,
  after: unknown,
  snippets: ReviewSnippet[],
  anchors: string[] = [],
): void {
  if (typeof after === "string") {
    const text = after.trim();
    const previous = typeof before === "string" ? before.trim() : "";
    if (text !== previous) pushSnippet(snippets, text, anchors);
    return;
  }

  if (Array.isArray(after)) {
    const beforeItems = Array.isArray(before) ? before : [];
    after.forEach((item, index) => {
      collectChangedStringLeaves(getBeforeArrayItem(beforeItems, item, index), item, snippets, anchors);
    });
    return;
  }

  if (!after || typeof after !== "object") return;

  const afterRecord = after as Record<string, unknown>;
  const beforeRecord = before && typeof before === "object" ? before as Record<string, unknown> : {};
  Object.entries(afterRecord).forEach(([key, value]) => {
    if (key === "id" || key === "photo") return;
    const siblingAnchors = stringsFrom(
      Object.fromEntries(Object.entries(afterRecord).filter(([siblingKey]) => siblingKey !== key))
    );
    collectChangedStringLeaves(beforeRecord[key], value, snippets, mergeAnchors(anchors, siblingAnchors));
  });
}

export function getReviewSnippets(change: AgentChange): ReviewSnippet[] {
  const snippets: ReviewSnippet[] = [];
  collectChangedDateRanges(change.before, change.after, snippets);
  collectChangedStringLeaves(change.before, change.after, snippets);

  const seen = new Set<string>();
  return snippets
    .sort((a, b) => b.text.length - a.text.length)
    .filter((snippet) => {
      const key = `${snippet.text}\n${snippet.anchors.join("\n")}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .slice(0, 40);
}

