export interface AgentChange {
  id: string;
  before: unknown;
  after: unknown;
  beforeSignature: string;
  afterSignature: string;
  addedWords: number;
  removedWords: number;
  toolNames: string[];
}

function stableStringify(value: unknown): string {
  if (Array.isArray(value)) {
    return `[${value.map(stableStringify).join(",")}]`;
  }

  if (value && typeof value === "object") {
    return `{${Object.entries(value)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, nested]) => `${JSON.stringify(key)}:${stableStringify(nested)}`)
      .join(",")}}`;
  }

  return JSON.stringify(value);
}

function collectText(value: unknown, parts: string[]): void {
  if (typeof value === "string") {
    parts.push(value);
    return;
  }

  if (Array.isArray(value)) {
    value.forEach((item) => collectText(item, parts));
    return;
  }

  if (value && typeof value === "object") {
    Object.entries(value).forEach(([key, nested]) => {
      if (key !== "id" && key !== "photo") collectText(nested, parts);
    });
  }
}

function tokenizeContent(value: unknown): string[] {
  const parts: string[] = [];
  collectText(value, parts);
  return parts
    .join(" ")
    .toLowerCase()
    .match(/[\p{L}\p{N}]+(?:['-][\p{L}\p{N}]+)?/gu) ?? [];
}

function countTokenDiff(before: string[], after: string[]): { added: number; removed: number } {
  const previous = new Map<string, number>();
  before.forEach((token) => previous.set(token, (previous.get(token) ?? 0) + 1));

  let shared = 0;
  after.forEach((token) => {
    const count = previous.get(token) ?? 0;
    if (count <= 0) return;
    shared += 1;
    previous.set(token, count - 1);
  });

  return {
    added: Math.max(0, after.length - shared),
    removed: Math.max(0, before.length - shared),
  };
}

export function contentSignature(value: unknown): string {
  return stableStringify(value);
}

export function buildAgentChange(before: unknown, after: unknown, toolNames: string[]): AgentChange | null {
  const beforeSignature = contentSignature(before);
  const afterSignature = contentSignature(after);
  if (beforeSignature === afterSignature) return null;

  const diff = countTokenDiff(tokenizeContent(before), tokenizeContent(after));

  return {
    id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
    before,
    after,
    beforeSignature,
    afterSignature,
    addedWords: diff.added,
    removedWords: diff.removed,
    toolNames: Array.from(new Set(toolNames)),
  };
}
