import type { AgentChange } from "@/lib/agent/change-tracking";

export interface ReviewSnippet {
  text: string;
  anchors: string[];
}

const MIN_ARRAY_ITEM_SIMILARITY = 0.5;

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

function similarityScore(before: unknown, after: unknown): number {
  if (Object.is(before, after)) return 1;

  const beforeStrings = stringsFrom(before).map((value) => value.toLowerCase());
  const afterStrings = stringsFrom(after).map((value) => value.toLowerCase());
  if (beforeStrings.length === 0 || afterStrings.length === 0) return 0;

  const remaining = new Map<string, number>();
  beforeStrings.forEach((value) => {
    remaining.set(value, (remaining.get(value) ?? 0) + 1);
  });

  let shared = 0;
  afterStrings.forEach((value) => {
    const count = remaining.get(value) ?? 0;
    if (count <= 0) return;
    shared += 1;
    remaining.set(value, count - 1);
  });

  return (2 * shared) / (beforeStrings.length + afterStrings.length);
}

function matchBeforeArrayItems(
  beforeItems: unknown[],
  afterItems: unknown[],
): Array<unknown | undefined> {
  const matches: Array<unknown | undefined> = Array(afterItems.length);
  const usedBeforeIndexes = new Set<number>();

  afterItems.forEach((afterItem, afterIndex) => {
    const id = getItemId(afterItem);
    if (!id) return;

    const beforeIndex = beforeItems.findIndex(
      (beforeItem, index) =>
        !usedBeforeIndexes.has(index) && getItemId(beforeItem) === id,
    );
    if (beforeIndex < 0) return;

    matches[afterIndex] = beforeItems[beforeIndex];
    usedBeforeIndexes.add(beforeIndex);
  });

  afterItems.forEach((afterItem, afterIndex) => {
    if (matches[afterIndex] !== undefined) return;

    let bestBeforeIndex = -1;
    let bestScore = 0;
    beforeItems.forEach((beforeItem, beforeIndex) => {
      if (usedBeforeIndexes.has(beforeIndex)) return;
      const score = similarityScore(beforeItem, afterItem);
      if (score <= bestScore) return;
      bestScore = score;
      bestBeforeIndex = beforeIndex;
    });

    if (
      bestBeforeIndex < 0 ||
      bestScore < MIN_ARRAY_ITEM_SIMILARITY
    ) {
      return;
    }
    matches[afterIndex] = beforeItems[bestBeforeIndex];
    usedBeforeIndexes.add(bestBeforeIndex);
  });

  afterItems.forEach((_, afterIndex) => {
    if (
      matches[afterIndex] !== undefined ||
      usedBeforeIndexes.has(afterIndex) ||
      afterIndex >= beforeItems.length
    ) {
      return;
    }

    matches[afterIndex] = beforeItems[afterIndex];
    usedBeforeIndexes.add(afterIndex);
  });

  return matches;
}

function uniqueStrings(values: string[]): string[] {
  return Array.from(new Set(
    values
      .map((value) => value.trim())
      .filter((value) => value.length > 1 && value.length <= 140)
  ));
}

function mergeAnchors(...groups: string[][]): string[] {
  return uniqueStrings(groups.flat()).slice(0, 12);
}

function pushSnippet(snippets: ReviewSnippet[], text: string, anchors: string[]): void {
  const trimmed = text.trim();
  if (!trimmed) return;
  snippets.push({
    text: trimmed,
    anchors: mergeAnchors(anchors).filter((anchor) => anchor !== trimmed),
  });
}

function collectChangedDateRanges(
  before: unknown,
  after: unknown,
  snippets: ReviewSnippet[],
  anchors: string[] = [],
): void {
  if (Array.isArray(after)) {
    const beforeItems = Array.isArray(before) ? before : [];
    const beforeMatches = matchBeforeArrayItems(beforeItems, after);
    after.forEach((item, index) => {
      collectChangedDateRanges(
        beforeMatches[index],
        item,
        snippets,
        mergeAnchors(stringsFrom(item), anchors),
      );
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
    collectChangedDateRanges(beforeRecord[key], value, snippets, mergeAnchors(siblingAnchors, anchors));
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
    const beforeMatches = matchBeforeArrayItems(beforeItems, after);
    after.forEach((item, index) => {
      collectChangedStringLeaves(
        beforeMatches[index],
        item,
        snippets,
        mergeAnchors(stringsFrom(item), anchors),
      );
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
    collectChangedStringLeaves(beforeRecord[key], value, snippets, mergeAnchors(siblingAnchors, anchors));
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
