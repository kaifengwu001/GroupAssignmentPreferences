/**
 * Name handling. Students sign in by typing their name, so lookups must be
 * forgiving about case and spacing while the displayed name stays as typed.
 */

/** Collapses whitespace and trims, preserving the student's own casing. */
export function normalizeName(input: string): string {
  return input.replace(/\s+/g, " ").trim();
}

/**
 * Canonical lookup key: lowercased, whitespace-collapsed, and stripped of
 * punctuation so "O'Brien", "obrien", and "O Brien" resolve to one student.
 */
export function toNameKey(input: string): string {
  return normalizeName(input)
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9 ]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

export function sortByName<T extends { name: string }>(items: readonly T[]): T[] {
  return [...items].sort((a, b) => a.name.localeCompare(b.name, "en", { sensitivity: "base" }));
}
