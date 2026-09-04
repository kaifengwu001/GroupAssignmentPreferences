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

export function toCsv(headers: readonly string[], rows: readonly CsvRow[]): string {
  const lines = [headers, ...rows].map((row) => row.map(escapeField).join(","));
  // Leading BOM so Excel detects UTF-8 and renders accented names correctly.
  return `\uFEFF${lines.join("\r\n")}\r\n`;
}

export function csvFilename(base: string): string {
  const stamp = new Date().toISOString().slice(0, 16).replace(/[:T]/g, "-");
  return `${base}-${stamp}.csv`;
}
