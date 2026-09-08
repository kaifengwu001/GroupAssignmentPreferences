/**
 * Application errors carry a machine-readable code, an HTTP status, and a
 * message that is safe to render directly in the UI. Anything not derived from
 * AppError is treated as unexpected and never surfaced verbatim to a student.
 */

export type ErrorCode =
  | "validation_failed"
  | "not_on_roster"
  | "wrong_password"
  | "password_required"
  | "unauthenticated"
  | "pitch_required"
  | "section_required"
  | "locked"
  | "not_found"
  | "internal";

export class AppError extends Error {
  readonly code: ErrorCode;
  readonly status: number;
  readonly details?: Readonly<Record<string, string>>;

  constructor(
    code: ErrorCode,
    status: number,
    message: string,
    details?: Readonly<Record<string, string>>,
  ) {
    super(message);
    this.name = "AppError";
    this.code = code;
    this.status = status;
    this.details = details;
  }
}

export const validationFailed = (message: string, details?: Record<string, string>) =>
  new AppError("validation_failed", 400, message, details);

export const notOnRoster = (name: string) =>
  new AppError(
    "not_on_roster",
    403,
    `"${name}" is not on the section roster. Check the spelling, or ask your instructor to add you.`,
  );

export const wrongPassword = () =>
  new AppError("wrong_password", 401, "That password does not match this name.");

export const passwordRequired = () =>
  new AppError("password_required", 401, "This name is protected by a password.");

export const unauthenticated = () =>
  new AppError("unauthenticated", 401, "Please sign in again.");

export const pitchRequired = () =>
  new AppError("pitch_required", 403, "Share your project pitch before viewing the section.");

export const sectionRequired = () =>
  new AppError("section_required", 403, "Choose which section you are in first.");

export const locked = () =>
  new AppError("locked", 423, "Preferences have been locked in.");

export const notFound = (what: string) =>
  new AppError("not_found", 404, `${what} could not be found.`);

export function toAppError(error: unknown): AppError {
  if (error instanceof AppError) return error;
  return new AppError("internal", 500, "Something went wrong. Please try again.");
}

/** True when the error should be logged with a stack trace server-side. */
export function isUnexpected(error: unknown): boolean {
  return !(error instanceof AppError) || error.status >= 500;
}
