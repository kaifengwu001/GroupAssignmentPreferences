/**
 * Name handling. Students sign in by typing their name, so lookups must be
 * forgiving about the many ways a person writes their own name while the
 * displayed name stays tidy and consistent.
 */

/**
 * Characters that separate one part of a name from another. Commas matter
 * because rosters are usually kept as "Last, First", and hyphens matter
 * because "Rivera-Santos" and "Rivera Santos" are the same surname.
 */
const SEPARATORS = /[\s,;/\\_-]+/;

/** Anything that is neither alphanumeric nor a separator, e.g. ' and . */
const DROPPED = /[^a-z0-9\s,;/\\_-]/g;

const DIACRITICS = /[\u0300-\u036f]/g;

/** Collapses whitespace and trims, preserving the student's own casing. */
export function normalizeName(input: string): string {
  return input.replace(/\s+/g, " ").trim();
}

/**
 * The comparable parts of a name, lowercased, de-accented, stripped of
 * punctuation, and sorted.
 *
 * Sorting is what makes matching order-insensitive: a roster kept as
 * "Ashwood, Nadia" still matches a student who types "Nadia Ashwood", and
 * "Okonjo Blake, Marcus" matches "Marcus Okonjo Blake".
 */
export function nameTokens(input: string): readonly string[] {
  return input
    .normalize("NFKD")
    .replace(DIACRITICS, "")
    .toLowerCase()
    .replace(DROPPED, "")
    .split(SEPARATORS)
    .filter((token) => token.length > 0)
    .sort();
}

/**
 * Canonical lookup key. Two spellings of the same name produce the same key
 * regardless of order, case, accents, punctuation, or spacing.
 *
 * The trade-off of order-insensitivity is that two people whose names are
 * anagrams of each other by word ("Kestrel, Devon" and "Devon, Kestrel")
 * would collide. The roster integrity test guards against that.
 */
export function toNameKey(input: string): string {
  return nameTokens(input).join(" ");
}

/**
 * How a name is shown to everyone. Roster entries are typically "Last, First",
 * which reads badly on a peer card, so the comma form is flipped to natural
 * order. Names without a comma are left as the student typed them.
 */
export function displayName(input: string): string {
  const normalized = normalizeName(input);
  const comma = normalized.indexOf(",");

  if (comma === -1) return normalized;

  const family = normalized.slice(0, comma).trim();
  const given = normalized.slice(comma + 1).trim();

  // A stray leading or trailing comma is not a swap, just noise.
  if (family.length === 0 || given.length === 0) {
    return normalizeName(normalized.replace(/,/g, " "));
  }

  return `${given} ${family}`;
}

export function sortByName<T extends { name: string }>(items: readonly T[]): T[] {
  return [...items].sort((a, b) => a.name.localeCompare(b.name, "en", { sensitivity: "base" }));
}
