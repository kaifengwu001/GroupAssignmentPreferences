/** Minimal class-name joiner; avoids pulling in clsx for a handful of uses. */
export function cn(...values: (string | false | null | undefined)[]): string {
  return values.filter(Boolean).join(" ");
}
