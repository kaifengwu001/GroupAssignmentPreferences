/**
 * Environment configuration. Every value is read lazily so that a missing
 * variable surfaces as a clear runtime error on the request that needs it,
 * rather than crashing the build.
 */

const DEV_SESSION_SECRET = "dev-only-insecure-secret-change-me-0000000000";

function isProduction(): boolean {
  return process.env.NODE_ENV === "production";
}

/** Postgres connection string. Absent in local dev falls back to memory store. */
export function databaseUrl(): string | null {
  const raw = process.env.DATABASE_URL?.trim();
  return raw && raw.length > 0 ? raw : null;
}

/** Secret used to sign session cookies. */
export function sessionSecret(): Uint8Array {
  const raw = process.env.SESSION_SECRET?.trim();

  if (!raw || raw.length < 32) {
    if (isProduction()) {
      throw new Error(
        "SESSION_SECRET must be set to a random string of at least 32 characters in production.",
      );
    }
    return new TextEncoder().encode(DEV_SESSION_SECRET);
  }

  return new TextEncoder().encode(raw);
}

/** Password that unlocks the instructor dashboard. */
export function adminPassword(): string | null {
  const raw = process.env.ADMIN_PASSWORD?.trim();
  return raw && raw.length > 0 ? raw : null;
}

/**
 * Optional allowlist of student names. When set, only these names may sign in.
 * Accepts newline- or comma-separated values.
 */
export function roster(): readonly string[] {
  const raw = process.env.SECTION_ROSTER?.trim();
  if (!raw) return [];

  return raw
    .split(/[\n,]/)
    .map((entry) => entry.trim())
    .filter((entry) => entry.length > 0);
}

/** Heading shown across the app. */
export function sectionTitle(): string {
  return process.env.SECTION_TITLE?.trim() || "SECTION PITCH";
}

const DEFAULT_CLOSES_AT = "2026-09-17T23:59:00-07:00";
const DEFAULT_RESULTS_AT = "2026-09-18T14:00:00-07:00";

function parseDate(raw: string | undefined, fallback: string, name: string): Date | null {
  const value = raw?.trim() || fallback;
  const parsed = new Date(value);

  if (Number.isNaN(parsed.getTime())) {
    console.error(`[section-pitch] ${name} is not a valid date: "${value}". Ignoring it.`);
    return null;
  }

  return parsed;
}

/**
 * When pitching and selection close. Reaching this instant locks the app on
 * its own; the admin switch can still close things early.
 */
export function closesAt(): Date | null {
  return parseDate(process.env.CLOSES_AT, DEFAULT_CLOSES_AT, "CLOSES_AT");
}

/** When groups get published. Display only. */
export function resultsAt(): Date | null {
  return parseDate(process.env.RESULTS_AT, DEFAULT_RESULTS_AT, "RESULTS_AT");
}

/**
 * Whether students may claim a name that has no password by supplying one.
 * Defaults to true, which lets each student lock their own name on first use.
 */
export function allowPasswordClaim(): boolean {
  return process.env.ALLOW_PASSWORD_CLAIM !== "false";
}

export { isProduction };
