// keeps repeated form list edits small and consistent.
export function updateItemAt<T>(items: T[], index: number, update: (item: T) => T): T[] {
  return items.map((item, itemIndex) => itemIndex === index ? update(item) : item);
}

export function removeItemAt<T>(items: T[], index: number): T[] {
  return items.filter((_, itemIndex) => itemIndex !== index);
}

export function moveItem<T>(items: T[], index: number, direction: -1 | 1): T[] {
  const target = index + direction;
  if (target < 0 || target >= items.length) return items;

  const next = [...items];
  [next[index], next[target]] = [next[target], next[index]];
  return next;
}
