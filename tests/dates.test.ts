import { afterEach, describe, expect, it, vi } from "vitest";

import { formatDate, formatDateTime, timeRemaining } from "@/lib/dates";
import { ordinal } from "@/lib/ordinal";

afterEach(() => {
  vi.unstubAllEnvs();
});

const CLOSES = new Date("2026-09-18T06:59:00Z"); // 23:59 on the 17th, Pacific

describe("formatDateTime", () => {
  it("renders in the configured timezone, not the viewer's", () => {
    vi.stubEnv("DISPLAY_TIMEZONE", "America/Los_Angeles");
    const formatted = formatDateTime(CLOSES);

    expect(formatted).toContain("17 September");
    expect(formatted).toContain("11:59");
  });

  it("names the zone in the common abbreviated form", () => {
    vi.stubEnv("DISPLAY_TIMEZONE", "America/Los_Angeles");

    // The bug this guards: the en-GB locale renders this as "GMT-7".
    expect(formatDateTime(CLOSES)).toContain("PDT");
  });

  it("shifts with the timezone setting", () => {
    vi.stubEnv("DISPLAY_TIMEZONE", "America/New_York");
    expect(formatDateTime(CLOSES)).toContain("18 September");
  });
});

describe("formatDate", () => {
  it("renders a date without a time", () => {
    vi.stubEnv("DISPLAY_TIMEZONE", "America/Los_Angeles");
    const formatted = formatDate(new Date("2026-09-18T21:00:00Z"));

    expect(formatted).toContain("18 September");
    expect(formatted).not.toContain(":");
  });
});

describe("timeRemaining", () => {
  it("counts whole days out", () => {
    const now = new Date("2026-09-07T12:00:00Z");
    expect(timeRemaining(new Date("2026-09-17T12:00:00Z"), now)).toBe("10 days left");
  });

  it("prefers hours under two days, where they are more actionable", () => {
    const now = new Date("2026-09-16T12:00:00Z");
    expect(timeRemaining(new Date("2026-09-17T12:00:00Z"), now)).toBe("24 hours left");
  });

  it("switches from hours to days at 48 hours", () => {
    const deadline = new Date("2026-09-17T12:00:00Z");

    expect(timeRemaining(deadline, new Date("2026-09-15T13:00:00Z"))).toBe("47 hours left");
    expect(timeRemaining(deadline, new Date("2026-09-15T12:00:00Z"))).toBe("2 days left");
  });

  it("switches to hours inside a day", () => {
    const now = new Date("2026-09-17T09:00:00Z");
    expect(timeRemaining(new Date("2026-09-17T12:00:00Z"), now)).toBe("3 hours left");
  });

  it("falls back to minutes in the final hour", () => {
    const now = new Date("2026-09-17T11:30:00Z");
    expect(timeRemaining(new Date("2026-09-17T12:00:00Z"), now)).toBe("30 minutes left");
  });

  it("never shows zero, rounding the last moments up to a minute", () => {
    const now = new Date("2026-09-17T11:59:59Z");
    expect(timeRemaining(new Date("2026-09-17T12:00:00Z"), now)).toBe("1 minute left");
  });

  it("returns null once the deadline has passed", () => {
    const now = new Date("2026-09-18T12:00:00Z");
    expect(timeRemaining(new Date("2026-09-17T12:00:00Z"), now)).toBeNull();
  });
});

describe("ordinal", () => {
  it("handles the common cases", () => {
    expect([1, 2, 3, 4, 11, 12, 13, 21, 22, 23, 101, 111].map(ordinal)).toEqual([
      "1st",
      "2nd",
      "3rd",
      "4th",
      "11th",
      "12th",
      "13th",
      "21st",
      "22nd",
      "23rd",
      "101st",
      "111th",
    ]);
  });
});
