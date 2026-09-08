import { describe, expect, it } from "vitest";

import {
  adminLoginSchema,
  lockSchema,
  loginSchema,
  NAME_MAX,
  PITCH_MAX,
  pitchSchema,
  preferencesSchema,
} from "@/lib/validation/schemas";

/**
 * Validation is the outer boundary, so these lean on rejection rather than
 * acceptance: anything that gets through reaches the database.
 */

const UUID = "3f1c9b62-0000-4000-8000-000000000000";

describe("loginSchema", () => {
  it("accepts a name, section, and no password", () => {
    const parsed = loginSchema.parse({ name: "Nadia Ashwood", section: "2pm" });

    expect(parsed.password).toBe("");
    expect(parsed.section).toBe("2pm");
  });

  it("keeps a comma-form name intact for the matcher to handle", () => {
    expect(loginSchema.parse({ name: "Ashwood, Nadia", section: "2pm" }).name).toBe(
      "Ashwood, Nadia",
    );
  });

  it("trims surrounding whitespace", () => {
    expect(loginSchema.parse({ name: "  Nadia  ", section: "2pm" }).name).toBe("Nadia");
  });

  it("rejects a one-character name", () => {
    expect(() => loginSchema.parse({ name: "N", section: "2pm" })).toThrow();
  });

  it("rejects a name with no letters in it", () => {
    expect(() => loginSchema.parse({ name: "1234", section: "2pm" })).toThrow();
  });

  it("rejects an over-long name", () => {
    expect(() =>
      loginSchema.parse({ name: "a".repeat(NAME_MAX + 1), section: "2pm" }),
    ).toThrow();
  });

  it("rejects an unknown section", () => {
    expect(() => loginSchema.parse({ name: "Nadia", section: "4pm" })).toThrow();
  });

  it("requires a section", () => {
    expect(() => loginSchema.parse({ name: "Nadia" })).toThrow();
  });

  it("rejects a password below the minimum but allows none at all", () => {
    expect(() => loginSchema.parse({ name: "Nadia", section: "2pm", password: "ab" })).toThrow();
    expect(loginSchema.parse({ name: "Nadia", section: "2pm", password: "" }).password).toBe("");
  });

  it("rejects a non-string name", () => {
    expect(() => loginSchema.parse({ name: 42, section: "2pm" })).toThrow();
  });
});

describe("pitchSchema", () => {
  it("accepts a normal pitch", () => {
    expect(pitchSchema.parse({ pitch: "A packet-routing sandbox." }).pitch).toBe(
      "A packet-routing sandbox.",
    );
  });

  it("rejects something too short to be useful", () => {
    expect(() => pitchSchema.parse({ pitch: "dunno" })).toThrow();
  });

  it("rejects whitespace padded out to look long enough", () => {
    expect(() => pitchSchema.parse({ pitch: `  ${" ".repeat(40)}hi  ` })).toThrow();
  });

  it(`accepts exactly ${PITCH_MAX} characters and rejects one more`, () => {
    expect(() => pitchSchema.parse({ pitch: "a".repeat(PITCH_MAX) })).not.toThrow();
    expect(() => pitchSchema.parse({ pitch: "a".repeat(PITCH_MAX + 1) })).toThrow();
  });
});

describe("preferencesSchema", () => {
  it("accepts an ordered list of ids", () => {
    expect(preferencesSchema.parse({ orderedTargetIds: [UUID] }).orderedTargetIds).toEqual([
      UUID,
    ]);
  });

  it("accepts an empty list, which clears a ranking", () => {
    expect(preferencesSchema.parse({ orderedTargetIds: [] }).orderedTargetIds).toEqual([]);
  });

  it("rejects anything that is not a uuid", () => {
    expect(() => preferencesSchema.parse({ orderedTargetIds: ["not-a-uuid"] })).toThrow();
  });

  it("rejects an absurdly large payload", () => {
    expect(() =>
      preferencesSchema.parse({ orderedTargetIds: Array(501).fill(UUID) }),
    ).toThrow();
  });

  it("rejects a bare string where a list belongs", () => {
    expect(() => preferencesSchema.parse({ orderedTargetIds: UUID })).toThrow();
  });

  it("preserves the submitted order, which carries the ranking", () => {
    const second = "3f1c9b62-0000-4000-8000-000000000001";
    const parsed = preferencesSchema.parse({ orderedTargetIds: [second, UUID] });

    expect(parsed.orderedTargetIds).toEqual([second, UUID]);
  });
});

describe("admin schemas", () => {
  it("requires a non-empty admin password", () => {
    expect(() => adminLoginSchema.parse({ password: "" })).toThrow();
    expect(adminLoginSchema.parse({ password: "x" }).password).toBe("x");
  });

  it("requires a real boolean for the lock switch", () => {
    expect(lockSchema.parse({ locked: true }).locked).toBe(true);
    expect(() => lockSchema.parse({ locked: "true" })).toThrow();
  });
});
