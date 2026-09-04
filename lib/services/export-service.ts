import { toCsv } from "@/lib/csv";
import { sortByName } from "@/lib/names";
import { getStore } from "@/lib/store";
import type { PreferenceEdge, Student } from "@/lib/store/types";

/**
 * CSV views over the same data. `students` is the one to open first; `pairs`
 * suits scripting or pivot tables; `matrix` is the grid to eyeball for groups.
 */

export type ExportFormat = "students" | "pairs" | "matrix";

export const EXPORT_FORMATS: readonly ExportFormat[] = ["students", "pairs", "matrix"];

export function isExportFormat(value: string): value is ExportFormat {
  return (EXPORT_FORMATS as readonly string[]).includes(value);
}

type Dataset = {
  readonly students: readonly Student[];
  readonly chosenBy: ReadonlyMap<string, readonly string[]>;
  readonly choices: ReadonlyMap<string, readonly string[]>;
};

function group(edges: readonly PreferenceEdge[], key: "studentId" | "targetId") {
  return edges.reduce((acc, edge) => {
    const bucket = acc.get(edge[key]) ?? [];
    const other = key === "studentId" ? edge.targetId : edge.studentId;
    return new Map(acc).set(edge[key], [...bucket, other]);
  }, new Map<string, readonly string[]>());
}

async function loadDataset(): Promise<Dataset> {
  const store = await getStore();
  const [students, edges] = await Promise.all([
    store.listStudents(),
    store.listAllPreferences(),
  ]);

  return {
    students: sortByName([...students]),
    choices: group(edges, "studentId"),
    chosenBy: group(edges, "targetId"),
  };
}

function nameOf(dataset: Dataset, id: string): string {
  return dataset.students.find((student) => student.id === id)?.name ?? "(removed)";
}

function namesOf(dataset: Dataset, ids: readonly string[]): string[] {
  return ids.map((id) => nameOf(dataset, id)).sort((a, b) => a.localeCompare(b));
}

function studentsCsv(dataset: Dataset): string {
  const rows = dataset.students.map((student) => {
    const chose = dataset.choices.get(student.id) ?? [];
    const chosen = dataset.chosenBy.get(student.id) ?? [];
    const mutual = chose.filter((id) => (dataset.choices.get(id) ?? []).includes(student.id));

    return [
      student.name,
      student.pitch ?? "",
      student.pitch ? "yes" : "no",
      chose.length,
      chosen.length,
      mutual.length,
      namesOf(dataset, chose).join("; "),
      namesOf(dataset, chosen).join("; "),
      namesOf(dataset, mutual).join("; "),
      student.updatedAt,
    ];
  });

  return toCsv(
    [
      "name",
      "pitch",
      "submitted_pitch",
      "num_selected",
      "num_times_selected",
      "num_mutual",
      "selected",
      "selected_by",
      "mutual",
      "last_updated",
    ],
    rows,
  );
}

function pairsCsv(dataset: Dataset): string {
  const rows = dataset.students.flatMap((student) =>
    namesOf(dataset, dataset.choices.get(student.id) ?? []).map((targetName) => {
      const targetId = dataset.students.find((other) => other.name === targetName)?.id;
      const reciprocal =
        targetId !== undefined &&
        (dataset.choices.get(targetId) ?? []).includes(student.id);

      return [student.name, targetName, reciprocal ? "yes" : "no"];
    }),
  );

  return toCsv(["chooser", "chosen", "mutual"], rows);
}

function matrixCsv(dataset: Dataset): string {
  const headers = ["chooser \\ chosen", ...dataset.students.map((student) => student.name)];

  const rows = dataset.students.map((student) => {
    const chose = new Set(dataset.choices.get(student.id) ?? []);
    return [
      student.name,
      // "x" rather than "-" on the diagonal: a leading dash would trip the
      // spreadsheet formula guard and show up quoted.
      ...dataset.students.map((other) => {
        if (other.id === student.id) return "x";
        return chose.has(other.id) ? "1" : "0";
      }),
    ];
  });

  return toCsv(headers, rows);
}

export async function buildExport(format: ExportFormat): Promise<string> {
  const dataset = await loadDataset();

  switch (format) {
    case "students":
      return studentsCsv(dataset);
    case "pairs":
      return pairsCsv(dataset);
    case "matrix":
      return matrixCsv(dataset);
  }
}
