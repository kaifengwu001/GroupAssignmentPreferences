import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { AppError } from "@/lib/errors";
import { savePreferences } from "@/lib/services/preference-service";
import { getSectionView } from "@/lib/services/section-service";
import { getStore } from "@/lib/store";
import type { Student } from "@/lib/store/types";

import { resetStore } from "./helpers/reset";

/** Four in the 2pm section, two in the 3pm, all without passwords. */
async function seed(): Promise<{
  nadia: Student;
  marcus: Student;
  priya: Student;
  fionn: Student;
  devon: Student;
}> {
  const store = await getStore();

  const make = (name: string, section: "2pm" | "3pm") =>
    store.createStudent({
      name,
      nameKey: name.toLowerCase(),
      section,
      passwordHash: null,
    });

  return {
    nadia: await make("Nadia", "2pm"),
    marcus: await make("Marcus", "2pm"),
    priya: await make("Priya", "2pm"),
    fionn: await make("Fionn", "2pm"),
    devon: await make("Devon", "3pm"),
  };
}

beforeEach(() => {
  resetStore();
});

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("savePreferences ordering", () => {
  it("keeps the submitted order as the ranking", async () => {
    const { nadia, marcus, priya, fionn } = await seed();

    const saved = await savePreferences(nadia.id, [priya.id, fionn.id, marcus.id]);
    expect(saved).toEqual([priya.id, fionn.id, marcus.id]);

    const stored = await (await getStore()).listPreferences(nadia.id);
    expect(stored).toEqual([priya.id, fionn.id, marcus.id]);
  });

  it("assigns 1-based ranks in submitted order", async () => {
    const { nadia, marcus, priya } = await seed();
    await savePreferences(nadia.id, [priya.id, marcus.id]);

    const edges = await (await getStore()).listAllPreferences();
    expect(edges).toEqual([
      { studentId: nadia.id, targetId: priya.id, rank: 1 },
      { studentId: nadia.id, targetId: marcus.id, rank: 2 },
    ]);
  });

  it("replaces the whole list rather than appending", async () => {
    const { nadia, marcus, priya } = await seed();

    await savePreferences(nadia.id, [priya.id, marcus.id]);
    await savePreferences(nadia.id, [marcus.id]);

    expect(await (await getStore()).listPreferences(nadia.id)).toEqual([marcus.id]);
  });

  it("is idempotent when the same order is sent twice", async () => {
    const { nadia, marcus, priya } = await seed();

    const first = await savePreferences(nadia.id, [priya.id, marcus.id]);
    const second = await savePreferences(nadia.id, [priya.id, marcus.id]);

    expect(second).toEqual(first);
  });

  it("accepts an empty list, clearing the ranking", async () => {
    const { nadia, marcus } = await seed();

    await savePreferences(nadia.id, [marcus.id]);
    await savePreferences(nadia.id, []);

    expect(await (await getStore()).listPreferences(nadia.id)).toEqual([]);
  });

  it("keeps the first occurrence when a duplicate is sent", async () => {
    const { nadia, marcus, priya } = await seed();

    const saved = await savePreferences(nadia.id, [priya.id, marcus.id, priya.id]);
    expect(saved).toEqual([priya.id, marcus.id]);
  });

  it("silently drops a self-reference", async () => {
    const { nadia, marcus } = await seed();

    const saved = await savePreferences(nadia.id, [nadia.id, marcus.id]);
    expect(saved).toEqual([marcus.id]);
  });
});

describe("savePreferences isolation", () => {
  it("refuses a classmate from the other section", async () => {
    const { nadia, devon } = await seed();

    await expect(savePreferences(nadia.id, [devon.id])).rejects.toBeInstanceOf(AppError);
  });

  it("refuses an id that does not exist", async () => {
    const { nadia } = await seed();

    await expect(
      savePreferences(nadia.id, ["3f1c9b62-0000-4000-8000-000000000000"]),
    ).rejects.toBeInstanceOf(AppError);
  });

  it("saves nothing at all when one entry is invalid", async () => {
    const { nadia, marcus, devon } = await seed();
    await savePreferences(nadia.id, [marcus.id]);

    await expect(savePreferences(nadia.id, [marcus.id, devon.id])).rejects.toThrow();

    // The earlier, valid ranking must survive a rejected save.
    expect(await (await getStore()).listPreferences(nadia.id)).toEqual([marcus.id]);
  });

  it("rejects an unknown student outright", async () => {
    await seed();

    await expect(
      savePreferences("3f1c9b62-0000-4000-8000-000000000000", []),
    ).rejects.toBeInstanceOf(AppError);
  });
});

describe("savePreferences when closed", () => {
  it("refuses after the deadline", async () => {
    const { nadia, marcus } = await seed();
    vi.stubEnv("CLOSES_AT", "2000-01-01T00:00:00Z");

    await expect(savePreferences(nadia.id, [marcus.id])).rejects.toThrow(/locked/i);
  });

  it("refuses while the instructor override is closed", async () => {
    const { nadia, marcus } = await seed();
    await (await getStore()).setSetting("locked", "closed");

    await expect(savePreferences(nadia.id, [marcus.id])).rejects.toThrow(/locked/i);
  });
});

describe("moving sections", () => {
  it("clears the mover's own ranking", async () => {
    const { nadia, marcus, priya } = await seed();
    await savePreferences(nadia.id, [marcus.id, priya.id]);

    await (await getStore()).moveToSection(nadia.id, "3pm");

    expect(await (await getStore()).listPreferences(nadia.id)).toEqual([]);
  });

  it("removes the mover from everyone else's ranking", async () => {
    const { nadia, marcus, priya } = await seed();
    await savePreferences(nadia.id, [marcus.id, priya.id]);
    await savePreferences(priya.id, [marcus.id, nadia.id]);

    await (await getStore()).moveToSection(nadia.id, "3pm");

    // Priya keeps Marcus, and closes the gap Nadia left behind.
    expect(await (await getStore()).listPreferences(priya.id)).toEqual([marcus.id]);
  });

  it("leaves no dangling cross-section edges", async () => {
    const { nadia, marcus, priya } = await seed();
    await savePreferences(priya.id, [nadia.id, marcus.id]);

    await (await getStore()).moveToSection(nadia.id, "3pm");

    const edges = await (await getStore()).listAllPreferences();
    expect(edges.some((edge) => edge.targetId === nadia.id)).toBe(false);
  });

  it("renumbers remaining ranks contiguously from 1", async () => {
    const { nadia, marcus, priya, fionn } = await seed();
    await savePreferences(priya.id, [nadia.id, marcus.id, fionn.id]);

    await (await getStore()).moveToSection(nadia.id, "3pm");

    const edges = await (await getStore()).listAllPreferences();
    expect(edges.map((edge) => edge.rank)).toEqual([1, 2]);
  });
});

describe("section view", () => {
  it("shows only classmates from the viewer's own section", async () => {
    const { nadia, devon } = await seed();

    const view = await getSectionView(nadia.id);
    expect(view.peers.map((peer) => peer.id)).not.toContain(devon.id);
    expect(view.peers).toHaveLength(3);
  });

  it("never includes the viewer among their peers", async () => {
    const { nadia } = await seed();

    const view = await getSectionView(nadia.id);
    expect(view.peers.map((peer) => peer.id)).not.toContain(nadia.id);
  });

  it("withholds other students' choices entirely", async () => {
    const { nadia, marcus, priya } = await seed();
    await savePreferences(priya.id, [marcus.id]);

    const view = await getSectionView(nadia.id);
    expect(JSON.stringify(view)).not.toContain('"rank"');
    expect(view.orderedSelectedIds).toEqual([]);
  });

  it("returns the viewer's own ranking in order", async () => {
    const { nadia, marcus, priya } = await seed();
    await savePreferences(nadia.id, [priya.id, marcus.id]);

    const view = await getSectionView(nadia.id);
    expect(view.orderedSelectedIds).toEqual([priya.id, marcus.id]);
  });

  it("counts pitches against the expected enrollment", async () => {
    const { nadia, marcus } = await seed();
    await (await getStore()).updatePitch(marcus.id, "A compiler explainer.");

    const view = await getSectionView(nadia.id);
    expect(view.pitchCount).toBe(1);
    expect(view.expectedStudents).toBe(25);
  });

  it("uses the roster length as the denominator when one is set", async () => {
    const { nadia } = await seed();
    vi.stubEnv("SECTION_ROSTER_2PM", "Ashwood, Nadia\nOkonjo Blake, Marcus");

    const view = await getSectionView(nadia.id);
    expect(view.expectedStudents).toBe(2);
  });
});
