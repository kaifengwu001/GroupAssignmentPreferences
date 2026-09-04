import { sortByName } from "@/lib/names";
import { getStore, isPersistent } from "@/lib/store";

import { isLocked } from "./lock-service";

/** Read model for the instructor dashboard. */

export type AdminRow = {
  readonly id: string;
  readonly name: string;
  readonly pitch: string | null;
  readonly hasPassword: boolean;
  readonly selected: readonly string[];
  readonly selectedBy: readonly string[];
  readonly mutual: readonly string[];
  readonly updatedAt: string;
};

export type AdminView = {
  readonly locked: boolean;
  readonly persistent: boolean;
  readonly rows: readonly AdminRow[];
  readonly stats: {
    readonly students: number;
    readonly pitches: number;
    readonly selections: number;
    readonly mutualPairs: number;
  };
};

export async function getAdminView(): Promise<AdminView> {
  const store = await getStore();

  const [students, edges, locked] = await Promise.all([
    store.listStudents(),
    store.listAllPreferences(),
    isLocked(),
  ]);

  const nameById = new Map(students.map((student) => [student.id, student.name]));
  const chose = new Map<string, string[]>();
  const chosenBy = new Map<string, string[]>();

  for (const edge of edges) {
    chose.set(edge.studentId, [...(chose.get(edge.studentId) ?? []), edge.targetId]);
    chosenBy.set(edge.targetId, [...(chosenBy.get(edge.targetId) ?? []), edge.studentId]);
  }

  const resolve = (ids: readonly string[]) =>
    ids
      .map((id) => nameById.get(id) ?? "(removed)")
      .sort((a, b) => a.localeCompare(b));

  const rows = sortByName([...students]).map((student): AdminRow => {
    const outgoing = chose.get(student.id) ?? [];
    const mutual = outgoing.filter((id) => (chose.get(id) ?? []).includes(student.id));

    return {
      id: student.id,
      name: student.name,
      pitch: student.pitch,
      hasPassword: student.hasPassword,
      selected: resolve(outgoing),
      selectedBy: resolve(chosenBy.get(student.id) ?? []),
      mutual: resolve(mutual),
      updatedAt: student.updatedAt,
    };
  });

  const mutualEdges = rows.reduce((total, row) => total + row.mutual.length, 0);

  return {
    locked,
    persistent: isPersistent(),
    rows,
    stats: {
      students: students.length,
      pitches: students.filter((student) => student.pitch !== null).length,
      selections: edges.length,
      mutualPairs: mutualEdges / 2,
    },
  };
}
