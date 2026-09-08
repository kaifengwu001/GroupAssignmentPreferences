/**
 * All dates are rendered in one fixed timezone so every student sees the same
 * deadline regardless of where their device thinks it is. Formatting happens
 * on the server and is passed down as strings, which also avoids hydration
 * mismatches.
 */

function timezone(): string {
  return process.env.DISPLAY_TIMEZONE?.trim() || "America/Los_Angeles";
}

/**
 * en-GB gives the day-before-month wording we want, but renders the zone as
 * "GMT-7". en-US names it properly, so the abbreviation is formatted
 * separately and appended.
 */
function zoneAbbreviation(date: Date): string {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: timezone(),
    timeZoneName: "short",
  }).formatToParts(date);

  return parts.find((part) => part.type === "timeZoneName")?.value ?? "";
}

/** e.g. "Thu 17 September at 11:59 pm PDT" */
export function formatDateTime(date: Date): string {
  const formatted = new Intl.DateTimeFormat("en-GB", {
    weekday: "short",
    day: "numeric",
    month: "long",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
    timeZone: timezone(),
  }).format(date);

  const zone = zoneAbbreviation(date);
  return zone ? `${formatted} ${zone}` : formatted;
}

/** e.g. "Friday 18 September" */
export function formatDate(date: Date): string {
  return new Intl.DateTimeFormat("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
    timeZone: timezone(),
  }).format(date);
}

/** Coarse countdown for the banner: "3 days left", "4 hours left". */
export function timeRemaining(deadline: Date, now: Date = new Date()): string | null {
  const ms = deadline.getTime() - now.getTime();
  if (ms <= 0) return null;

  const hours = Math.floor(ms / 3_600_000);
  if (hours >= 48) return `${Math.floor(hours / 24)} days left`;
  if (hours >= 1) return `${hours} hour${hours === 1 ? "" : "s"} left`;

  const minutes = Math.max(1, Math.floor(ms / 60_000));
  return `${minutes} minute${minutes === 1 ? "" : "s"} left`;
}
