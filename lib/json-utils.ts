type WithOptionalId = { id?: string };

const RESUME_LEGACY_CONTACT_TYPES = new Set(["addressLine1", "addressLine2", "addressLine3"]);

export function withId<T extends WithOptionalId>(items: unknown): T[] {
  return (Array.isArray(items) ? items : []).map((item) => {
    const obj = item as T;
    return { ...obj, id: obj.id ?? crypto.randomUUID() } as T;
  });
}

function compactComparable(value: string): string {
  return value.toLowerCase().replace(/[^\p{L}\p{N}]+/gu, " ").trim();
}

function isStandaloneDegree(value: string): boolean {
  return /^(phd|msc|bsc|meng|beng|ma|ba|llm|llb|mba|doctor of philosophy|master of science|bachelor of science|master of engineering|bachelor of engineering|master of arts|bachelor of arts|master of laws|bachelor of laws|master of business administration)$/i.test(value.trim());
}

export function formatDegreeField(degreeValue?: string, fieldValue?: string, lang: string = "en"): string {
  const degree = (degreeValue ?? "").trim();
  const field = (fieldValue ?? "").trim();
  if (!degree) return field;
  if (!field) return degree;

  const comparableDegree = compactComparable(degree);
  const comparableField = compactComparable(field);
  if (comparableDegree.includes(comparableField)) return degree;
  if (comparableField.includes(comparableDegree)) return field;

  if (lang === "zh") return `${field}${degree}`.trim();
  if (isStandaloneDegree(degree)) return `${degree} in ${field}`;
  return `${degree} ${field}`.trim();
}

/** Merges legacy separate `degree` + `field` into a single `degree` string and clears `field`. */
export function mergeDegreeField<T extends { degree?: string; field?: string }>(ed: T, lang: string): T {
  if (!ed.field) return ed;
  return { ...ed, degree: formatDegreeField(ed.degree, ed.field, lang), field: "" };
}

/** Removes the legacy `field` key from education items before JSON export. */
export function stripDegreeField<T extends { field?: unknown }>(education: T[]): Omit<T, "field">[] {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  return education.map(({ field: _field, ...rest }) => rest);
}

export function stripResumeLegacyContacts<
  T extends { personal: { contacts?: Array<{ type?: string }> } },
>(content: T): T {
  const contacts = content.personal.contacts ?? [];
  const nextContacts = contacts.filter((contact) => !RESUME_LEGACY_CONTACT_TYPES.has(contact.type ?? ""));
  if (nextContacts.length === contacts.length) return content;

  return {
    ...content,
    personal: {
      ...content.personal,
      contacts: nextContacts,
    },
  };
}
