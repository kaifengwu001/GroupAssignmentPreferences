/**
 * RFC 4180 CSV serialisation with spreadsheet formula-injection guarding, since
 * these files get opened directly in Excel or Sheets.
 */

const NEEDS_QUOTING = /[",\r\n]/;
const FORMULA_TRIGGER = /^[=+\-@\t\r]/;

function escapeField(value: string | number | null | undefined): string {
  if (value === null || value === undefined) return "";

  const raw = String(value);
  // A leading =, +, -, or @ makes Excel evaluate the cell as a formula.
  const safe = FORMULA_TRIGGER.test(raw) ? `'${raw}` : raw;

  return NEEDS_QUOTING.test(safe) ? `"${safe.replace(/"/g, '""')}"` : safe;
}

export type CsvRow = readonly (string | number | null | undefined)[];

/** Byte-order mark, so Excel detects UTF-8 and renders accented names correctly. */
export const CSV_BOM = "\uFEFF";

/**
 * A bare block with no BOM. Use this when concatenating several tables into
 * one file; the BOM belongs only at the very start.
 */
export function toCsvBody(headers: readonly string[], rows: readonly CsvRow[]): string {
  const lines = [headers, ...rows].map((row) => row.map(escapeField).join(","));
  return `${lines.join("\r\n")}\r\n`;
}

export function toCsv(headers: readonly string[], rows: readonly CsvRow[]): string {
  return `${CSV_BOM}${toCsvBody(headers, rows)}`;
}

export function csvFilename(base: string): string {
  const stamp = new Date().toISOString().slice(0, 16).replace(/[:T]/g, "-");
  return `${base}-${stamp}.csv`;
}
