import { afterEach, describe, expect, it, vi } from "vitest";

import {
  adminPassword,
  closesAt,
  expectedEnrollment,
  resultsAt,
  rosterEnforced,
  rosterEnvName,
  rosterFor,
  sectionTitle,
  sessionSecret,
} from "@/lib/config";

import { asRosterValue, FAKE_2PM, FAKE_3PM } from "./helpers/students";

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("rosterEnvName", () => {
  it("derives the variable name from the section id", () => {
    expect(rosterEnvName("2pm")).toBe("SECTION_ROSTER_2PM");
    expect(rosterEnvName("3pm")).toBe("SECTION_ROSTER_3PM");
  });
});

describe("rosterFor", () => {
  it("is empty when unset", () => {
    expect(rosterFor("2pm")).toEqual([]);
  });

  it("splits on newlines", () => {
    vi.stubEnv("SECTION_ROSTER_2PM", asRosterValue(FAKE_2PM));
    expect(rosterFor("2pm")).toEqual([...FAKE_2PM]);
  });

  it("does not split on commas, which are part of 'Last, First' names", () => {
    vi.stubEnv("SECTION_ROSTER_2PM", "Ashwood, Nadia\nKestrel, Devon");

    // The regression this guards: comma splitting would yield four "students".
    expect(rosterFor("2pm")).toEqual(["Ashwood, Nadia", "Kestrel, Devon"]);
  });

  it("accepts semicolons for single-line values", () => {
    vi.stubEnv("SECTION_ROSTER_2PM", "Ashwood, Nadia; Kestrel, Devon");
    expect(rosterFor("2pm")).toEqual(["Ashwood, Nadia", "Kestrel, Devon"]);
  });

  it("ignores blank lines and stray indentation from a paste", () => {
    vi.stubEnv("SECTION_ROSTER_2PM", "\n  Ashwood, Nadia  \n\n   \n  Kestrel, Devon\n");
    expect(rosterFor("2pm")).toEqual(["Ashwood, Nadia", "Kestrel, Devon"]);
  });

  it("keeps the two sections independent", () => {
    vi.stubEnv("SECTION_ROSTER_2PM", asRosterValue(FAKE_2PM));
    vi.stubEnv("SECTION_ROSTER_3PM", asRosterValue(FAKE_3PM));

    expect(rosterFor("2pm")).toHaveLength(FAKE_2PM.length);
    expect(rosterFor("3pm")).toHaveLength(FAKE_3PM.length);
  });
});

describe("rosterEnforced", () => {
  it("is false with no rosters configured", () => {
    expect(rosterEnforced()).toBe(false);
  });

  it("is true as soon as one section has a roster", () => {
    vi.stubEnv("SECTION_ROSTER_3PM", asRosterValue(FAKE_3PM));
    expect(rosterEnforced()).toBe(true);
  });

  it("is false when the value is only whitespace", () => {
    vi.stubEnv("SECTION_ROSTER_2PM", "   \n  \n");
    expect(rosterEnforced()).toBe(false);
  });
});

describe("expectedEnrollment", () => {
  it("falls back to the headcount in lib/sections.ts", () => {
    expect(expectedEnrollment("2pm")).toBe(25);
    expect(expectedEnrollment("3pm")).toBe(22);
  });

  it("prefers the roster length once a roster exists", () => {
    vi.stubEnv("SECTION_ROSTER_2PM", asRosterValue(FAKE_2PM));
    expect(expectedEnrollment("2pm")).toBe(FAKE_2PM.length);
  });

  it("leaves the other section on its fallback", () => {
    vi.stubEnv("SECTION_ROSTER_2PM", asRosterValue(FAKE_2PM));
    expect(expectedEnrollment("3pm")).toBe(22);
  });
});

describe("deadlines", () => {
  it("parses an ISO value with an offset", () => {
    vi.stubEnv("CLOSES_AT", "2026-09-17T23:59:00-07:00");
    expect(closesAt()?.toISOString()).toBe("2026-09-18T06:59:00.000Z");
  });

  it("falls back to the built-in default when unset", () => {
    expect(closesAt()).toBeInstanceOf(Date);
    expect(resultsAt()).toBeInstanceOf(Date);
  });

  it("returns null rather than an Invalid Date for nonsense", () => {
    vi.stubEnv("CLOSES_AT", "next tuesday-ish");
    vi.spyOn(console, "error").mockImplementation(() => {});

    expect(closesAt()).toBeNull();
  });
});

describe("secrets", () => {
  it("rejects a short SESSION_SECRET in production", () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("SESSION_SECRET", "too-short");

    expect(() => sessionSecret()).toThrow(/at least 32 characters/);
  });

  it("requires SESSION_SECRET at all in production", () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("SESSION_SECRET", "");

    expect(() => sessionSecret()).toThrow();
  });

  it("accepts a long enough secret", () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("SESSION_SECRET", "x".repeat(32));

    expect(sessionSecret()).toHaveLength(32);
  });

  it("falls back to a dev secret outside production", () => {
    vi.stubEnv("SESSION_SECRET", "");
    expect(sessionSecret().length).toBeGreaterThanOrEqual(32);
  });

  it("treats a blank ADMIN_PASSWORD as unset", () => {
    vi.stubEnv("ADMIN_PASSWORD", "   ");
    expect(adminPassword()).toBeNull();
  });
});

describe("sectionTitle", () => {
  it("has a default", () => {
    expect(sectionTitle()).toBe("SECTION PITCH");
  });

  it("can be overridden", () => {
    vi.stubEnv("SECTION_TITLE", "CS 101");
    expect(sectionTitle()).toBe("CS 101");
  });
});
