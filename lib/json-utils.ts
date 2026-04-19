// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function withId(items: unknown[]): any[] {
  return (Array.isArray(items) ? items : []).map((item) => {
    const obj = item as Record<string, unknown>;
    return { ...obj, id: (obj.id as string | undefined) ?? crypto.randomUUID() };
  });
}
