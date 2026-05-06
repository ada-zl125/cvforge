export function normalizeTextareaValue(value: string): string {
  return value.replace(/[ \t]*\r?\n[ \t]*/g, " ");
}
