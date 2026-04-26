type WithOptionalId = { id?: string };

export function withId<T extends WithOptionalId>(items: unknown): T[] {
  return (Array.isArray(items) ? items : []).map((item) => {
    const obj = item as T;
    return { ...obj, id: obj.id ?? crypto.randomUUID() } as T;
  });
}

/** Merges legacy separate `degree` + `field` into a single `degree` string and clears `field`. */
export function mergeDegreeField<T extends { degree?: string; field?: string }>(ed: T, lang: string): T {
  if (!ed.field) return ed;
  const degree = lang === "zh"
    ? `${ed.field}${ed.degree ?? ""}`.trim()
    : `${ed.degree ?? ""} ${ed.field}`.trim();
  return { ...ed, degree, field: "" };
}

/** Removes the legacy `field` key from education items before JSON export. */
export function stripDegreeField<T extends { field?: unknown }>(education: T[]): Omit<T, "field">[] {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  return education.map(({ field: _field, ...rest }) => rest);
}
