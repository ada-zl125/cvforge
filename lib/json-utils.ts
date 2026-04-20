// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function withId(items: unknown[]): any[] {
  return (Array.isArray(items) ? items : []).map((item) => {
    const obj = item as Record<string, unknown>;
    return { ...obj, id: (obj.id as string | undefined) ?? crypto.randomUUID() };
  });
}

/** Merges legacy separate `degree` + `field` into a single `degree` string and clears `field`. */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function mergeDegreeField(ed: any, lang: string): any {
  if (!ed.field) return ed;
  const degree = lang === "zh"
    ? `${ed.field}${ed.degree}`.trim()
    : `${ed.degree} ${ed.field}`.trim();
  return { ...ed, degree, field: "" };
}

/** Removes the legacy `field` key from education items before JSON export. */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function stripDegreeField(education: any[]): any[] {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  return education.map(({ field: _field, ...rest }) => rest);
}
