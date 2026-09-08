/**
 * The two class sections. Pitching and grouping are fully isolated: a student
 * only ever sees, and can only ever pick, classmates in their own section.
 *
 * To change the timetable, edit this list — it is the single source of truth
 * for validation, display, and CSV export.
 *
 * `enrolled` is the roster size, used as the denominator in "pitches in". It
 * is a headcount you maintain by hand, not something derived from sign-ins,
 * so students can see how many classmates are still missing.
 */
export const SECTIONS = [
  { id: "2pm", label: "2:00 PM", blurb: "2:00pm - 2:50pm with Kai", enrolled: 25 },
  { id: "3pm", label: "3:00 PM", blurb: "3:00pm - 3:50pm with Kai", enrolled: 22 },
] as const;

export type SectionId = (typeof SECTIONS)[number]["id"];

export const SECTION_IDS: readonly SectionId[] = SECTIONS.map((section) => section.id);

export function isSectionId(value: unknown): value is SectionId {
  return typeof value === "string" && (SECTION_IDS as readonly string[]).includes(value);
}

/** Human label for a section id, falling back to the raw value. */
export function sectionLabel(id: string | null): string {
  return SECTIONS.find((section) => section.id === id)?.label ?? "Unassigned";
}

/** Roster headcount for a section, used as the "pitches in" denominator. */
export function sectionEnrollment(id: SectionId): number {
  return SECTIONS.find((section) => section.id === id)?.enrolled ?? 0;
}
