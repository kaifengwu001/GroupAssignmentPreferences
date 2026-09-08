import { CSV_BOM, toCsv, toCsvBody, type CsvRow } from "@/lib/csv";
import { SECTIONS, sectionLabel } from "@/lib/sections";

import { getAdminView, type AdminGroup, type AdminRow } from "./admin-service";

/**
 * CSV views over the same data. All three carry the section and the rank of
 * every choice, since rank is what drives grouping.
 *
 * `students` is the one to open first; `pairs` suits scripting or pivot
 * tables; `matrix` is the grid to eyeball, emitted as one block per section.
 */

export type ExportFormat = "students" | "pairs" | "matrix";

export const EXPORT_FORMATS: readonly ExportFormat[] = ["students", "pairs", "matrix"];

export function isExportFormat(value: string): value is ExportFormat {
  return (EXPORT_FORMATS as readonly string[]).includes(value);
}

/** "1. Ada; 2. Grace; 3. Alan" — rank order made obvious in a single cell. */
function rankedList(entries: readonly { name: string; rank: number }[]): string {
  return entries.map((entry) => `${entry.rank}. ${entry.name}`).join("; ");
}

function studentsCsv(rows: readonly AdminRow[]): string {
  const csvRows = rows.map((row): CsvRow => {
    const [first, second, third] = row.choices;

    return [
      row.name,
      sectionLabel(row.section),
      row.pitch ?? "",
      row.pitch ? "yes" : "no",
      row.choices.length,
      first?.name ?? "",
      second?.name ?? "",
      third?.name ?? "",
      rankedList(row.choices),
      row.chosenBy.length,
      rankedList(row.chosenBy),
      row.mutual.length,
      row.mutual.join("; "),
      row.updatedAt,
    ];
  });

  return toCsv(
    [
      "name",
      "section",
      "pitch",
      "submitted_pitch",
      "num_choices",
      "choice_1",
      "choice_2",
      "choice_3",
      "all_choices_ranked",
      "num_times_chosen",
      "chosen_by_with_their_rank",
      "num_mutual",
      "mutual",
      "last_updated",
    ],
    csvRows,
  );
}

function pairsCsv(rows: readonly AdminRow[]): string {
  const mutualNames = new Map(rows.map((row) => [row.name, new Set(row.mutual)]));

  const csvRows = rows.flatMap((row) =>
    row.choices.map(
      (choice): CsvRow => [
        row.name,
        sectionLabel(row.section),
        choice.name,
        choice.rank,
        mutualNames.get(row.name)?.has(choice.name) ? "yes" : "no",
      ],
    ),
  );

  return toCsv(["chooser", "section", "chosen", "rank", "mutual"], csvRows);
}

/**
 * One grid per section. Cells hold the rank (1 = first choice), 0 for no
 * choice, and "x" on the diagonal — a leading dash would trip the spreadsheet
 * formula guard and show up quoted.
 */
function matrixCsv(groups: readonly AdminGroup[]): string {
  // Blocks are concatenated, so each is emitted bare and the BOM is prepended
  // once at the very start of the file.
  const blocks = groups
    .map((group) => {
      if (group.rows.length === 0) {
        return toCsvBody([`${group.label} section`], [["No students yet"]]);
      }

      const names = group.rows.map((row) => row.name);
      const headers = [`${group.label} — chooser \\ chosen`, ...names];

      const csvRows = group.rows.map((row): CsvRow => {
        const rankByName = new Map(row.choices.map((choice) => [choice.name, choice.rank]));

        return [
          row.name,
          ...group.rows.map((other) =>
            other.id === row.id ? "x" : (rankByName.get(other.name) ?? 0),
          ),
        ];
      });

      return toCsvBody(headers, csvRows);
    })
    .join("\r\n");

  return `${CSV_BOM}${blocks}`;
}

export async function buildExport(format: ExportFormat): Promise<string> {
  const view = await getAdminView();

  // Section order follows the timetable, with any unassigned students last.
  const ordered = [
    ...SECTIONS.flatMap(
      (section) => view.groups.find((group) => group.id === section.id)?.rows ?? [],
    ),
    ...view.unassigned,
  ];

  switch (format) {
    case "students":
      return studentsCsv(ordered);
    case "pairs":
      return pairsCsv(ordered);
    case "matrix":
      return matrixCsv(view.groups);
  }
}
