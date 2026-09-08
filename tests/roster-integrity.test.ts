import { config as loadEnv } from "dotenv";
import { describe, expect, it } from "vitest";

import { rosterEnvName, rosterFor } from "@/lib/config";
import { toNameKey } from "@/lib/names";
import { SECTIONS, type SectionId } from "@/lib/sections";

/**
 * Validates whatever roster is actually configured, rather than a fixture.
 *
 * This is the test that matters on the day: order-insensitive matching means
 * two students whose names are word-anagrams would share one account, and a
 * duplicate in a pasted roster would silently merge two people. Both are
 * invisible until a student complains that someone else's pitch is theirs.
 *
 * Skips when no roster is set, so it stays green in CI without secrets.
 */

// At module scope, not in a hook: skipIf is evaluated while tests are being
// collected, which happens before any hook runs.
loadEnv({ path: ".env.local", quiet: true });

function configured(): readonly SectionId[] {
  return SECTIONS.map((section) => section.id).filter((id) => rosterFor(id).length > 0);
}

describe("configured roster", () => {
  it("reports which sections have a roster", () => {
    const sections = configured();

    if (sections.length === 0) {
      console.warn(
        `[roster] none configured. Set ${SECTIONS.map((s) => rosterEnvName(s.id)).join(" and ")} to check the real list.`,
      );
    }

    expect(sections.length).toBeGreaterThanOrEqual(0);
  });

  for (const section of SECTIONS) {
    describe(`${section.label} (${rosterEnvName(section.id)})`, () => {
      it.skipIf(rosterFor(section.id).length === 0)("has no unmatchable entries", () => {
        const unmatchable = rosterFor(section.id).filter((entry) => toNameKey(entry).length === 0);
        expect(unmatchable).toEqual([]);
      });

      it.skipIf(rosterFor(section.id).length === 0)("has no two names that collide", () => {
        const seen = new Map<string, string>();
        const collisions: string[] = [];

        for (const entry of rosterFor(section.id)) {
          const key = toNameKey(entry);
          const previous = seen.get(key);
          if (previous) collisions.push(`"${previous}" vs "${entry}"`);
          else seen.set(key, entry);
        }

        expect(collisions).toEqual([]);
      });

      it.skipIf(rosterFor(section.id).length === 0)(
        "matches the headcount in lib/sections.ts",
        () => {
          // A mismatch means one of the two is stale; the roster is the one to
          // trust, but the discrepancy is worth surfacing.
          expect(rosterFor(section.id)).toHaveLength(section.enrolled);
        },
      );
    });
  }

  it.skipIf(configured().length < 2)("has nobody enrolled in both sections", () => {
    // name_key is globally unique in the database, so a student listed twice
    // would have one row fought over by two sections.
    const [first, second] = configured();
    const firstKeys = new Set(rosterFor(first).map(toNameKey));
    const overlap = rosterFor(second).filter((entry) => firstKeys.has(toNameKey(entry)));

    expect(overlap).toEqual([]);
  });
});
