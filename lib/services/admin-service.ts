import { formatDateTime } from "@/lib/dates";
import { sortByName } from "@/lib/names";
import { SECTIONS, type SectionId } from "@/lib/sections";
import { getStore, isPersistent } from "@/lib/store";
import type { PreferenceEdge, Student } from "@/lib/store/types";

import { getLockState } from "./lock-service";

/** Read model for the instructor dashboard, grouped by section. */

export type RankedName = {
  readonly name: string;
  readonly rank: number;
};

export type AdminRow = {
  readonly id: string;
  readonly name: string;
  readonly section: SectionId | null;
  readonly pitch: string | null;
  readonly hasPassword: boolean;
  /** Their picks, best first. */
  readonly choices: readonly RankedName[];
  /** Who picked them, and at what rank on that person's list. */
  readonly chosenBy: readonly RankedName[];
  readonly mutual: readonly string[];
  readonly updatedAt: string;
};

export type SectionStats = {
  readonly students: number;
  readonly pitches: number;
  readonly selections: number;
  readonly mutualPairs: number;
};

export type AdminGroup = {
  readonly id: SectionId;
  readonly label: string;
  readonly rows: readonly AdminRow[];
  readonly stats: SectionStats;
};

export type AdminView = {
  readonly locked: boolean;
  readonly lockReason: "deadline" | "instructor" | null;
  readonly closesAtLabel: string | null;
  readonly persistent: boolean;
  readonly groups: readonly AdminGroup[];
  readonly unassigned: readonly AdminRow[];
  readonly totals: SectionStats;
};

function buildRows(
  students: readonly Student[],
  edges: readonly PreferenceEdge[],
): readonly AdminRow[] {
  const nameById = new Map(students.map((student) => [student.id, student.name]));

  const outgoing = new Map<string, PreferenceEdge[]>();
  const incoming = new Map<string, PreferenceEdge[]>();

  for (const edge of edges) {
    outgoing.set(edge.studentId, [...(outgoing.get(edge.studentId) ?? []), edge]);
    incoming.set(edge.targetId, [...(incoming.get(edge.targetId) ?? []), edge]);
  }

  const byRank = (list: readonly PreferenceEdge[], key: "studentId" | "targetId") =>
    [...list]
      .sort((a, b) => a.rank - b.rank)
      .map(
        (edge): RankedName => ({
          name: nameById.get(edge[key]) ?? "(removed)",
          rank: edge.rank,
        }),
      );

  return sortByName([...students]).map((student): AdminRow => {
    const picks = outgoing.get(student.id) ?? [];
    const pickedBy = incoming.get(student.id) ?? [];
    const pickedByIds = new Set(pickedBy.map((edge) => edge.studentId));

    return {
      id: student.id,
      name: student.name,
      section: student.section,
      pitch: student.pitch,
      hasPassword: student.hasPassword,
      choices: byRank(picks, "targetId"),
      chosenBy: byRank(pickedBy, "studentId"),
      mutual: picks
        .filter((edge) => pickedByIds.has(edge.targetId))
        .map((edge) => nameById.get(edge.targetId) ?? "(removed)")
        .sort((a, b) => a.localeCompare(b)),
      updatedAt: student.updatedAt,
    };
  });
}

function statsFor(rows: readonly AdminRow[]): SectionStats {
  const selections = rows.reduce((total, row) => total + row.choices.length, 0);
  const mutualEnds = rows.reduce((total, row) => total + row.mutual.length, 0);

  return {
    students: rows.length,
    pitches: rows.filter((row) => row.pitch !== null).length,
    selections,
    // Each mutual pair is counted from both ends.
    mutualPairs: mutualEnds / 2,
  };
}

export async function getAdminView(): Promise<AdminView> {
  const store = await getStore();

  const [students, edges, lock] = await Promise.all([
    store.listStudents(),
    store.listAllPreferences(),
    getLockState(),
  ]);

  const rows = buildRows(students, edges);

  return {
    locked: lock.locked,
    lockReason: lock.reason,
    closesAtLabel: lock.closesAt ? formatDateTime(lock.closesAt) : null,
    persistent: isPersistent(),
    groups: SECTIONS.map((section): AdminGroup => {
      const sectionRows = rows.filter((row) => row.section === section.id);
      return {
        id: section.id,
        label: section.label,
        rows: sectionRows,
        stats: statsFor(sectionRows),
      };
    }),
    unassigned: rows.filter((row) => row.section === null),
    totals: statsFor(rows),
  };
}
