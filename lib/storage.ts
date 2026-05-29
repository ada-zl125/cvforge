/**
 * Generic sessionStorage helpers for editor state persistence.
 * Used by all three EditorContent components (resume, academic-cv, cover-letter).
 */

/**
 * Reads editor state from sessionStorage. Merges `content` with `defaultContent`
 * so new fields added to the schema are always present even in old saves.
 * Returns null when not found, unavailable (SSR), or unparseable.
 */
export function readEditorState<TState extends { content: TContent }, TContent>(
  key: string,
  defaultContent: TContent,
): Omit<TState, "hydrated"> | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(key);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (parsed?.content) {
      parsed.content = { ...defaultContent, ...parsed.content };
    }
    return parsed;
  } catch {
    return null;
  }
}

/**
 * Serializes editor state to sessionStorage.
 * Silently ignores storage quota errors.
 */
export function writeEditorState(key: string, state: unknown): void {
  try {
    sessionStorage.setItem(key, JSON.stringify(state));
  } catch {
    // Ignore storage quota errors.
  }
}
