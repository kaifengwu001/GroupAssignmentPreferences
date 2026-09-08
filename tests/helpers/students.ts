/**
 * Fictional students. Real class rosters must never be committed: this repo
 * is public. Names are chosen to exercise the awkward cases — a comma-form
 * roster entry, a two-word surname, a hyphen, an apostrophe, and an accent.
 */

export const FAKE_2PM = [
  "Ashwood, Nadia",
  "Okonjo Blake, Marcus",
  "Rivera-Santos, Priya",
  "O'Donnell, Fionn",
  "Ferrán, Lucía",
] as const;

export const FAKE_3PM = ["Kestrel, Devon", "Lindqvist, Sasha"] as const;

/** Roster env values are newline-separated, matching a pasted export. */
export function asRosterValue(entries: readonly string[]): string {
  return entries.join("\n");
}
