import { afterAll, beforeEach, describe, expect, it } from "vitest";

import { createMemoryStore } from "@/lib/store/memory-store";
import { createPostgresStore } from "@/lib/store/postgres-store";
import type { Store } from "@/lib/store/types";

import { resetStore } from "./helpers/reset";

/**
 * One suite, run against every store implementation, because the two must
 * behave identically — the app uses the memory store locally and Postgres in
 * production, and a divergence between them is invisible until it ships.
 *
 * Postgres is skipped unless TEST_DATABASE_URL points at a throwaway database.
 * The suite truncates tables, so never aim it at real data.
 */

const POSTGRES_URL = process.env.TEST_DATABASE_URL?.trim();

type Candidate = {
  readonly name: string;
  readonly create: () => Store;
  readonly clear: (store: Store) => Promise<void>;
};

const candidates: readonly Candidate[] = [
  {
    name: "memory",
    create: createMemoryStore,
    clear: async () => resetStore(),
  },
  ...(POSTGRES_URL
    ? [
        {
          name: "postgres",
          create: () => createPostgresStore(POSTGRES_URL),
          clear: async () => truncate(POSTGRES_URL),
        },
      ]
    : []),
];

async function truncate(connectionString: string): Promise<void> {
  const { Pool } = await import("pg");
  const pool = new Pool({
    connectionString,
    ssl: /@(localhost|127\.0\.0\.1)/.test(connectionString)
      ? undefined
      : { rejectUnauthorized: true },
  });

  try {
    await pool.query("TRUNCATE students, settings CASCADE");
  } finally {
    await pool.end();
  }
}

if (!POSTGRES_URL) {
  console.warn(
    "[store] TEST_DATABASE_URL not set - skipping the Postgres contract run. " +
      "The memory store alone cannot prove production behaviour.",
  );
}

describe.each(candidates)("$name store", ({ create, clear }) => {
  let store: Store;

  beforeEach(async () => {
    resetStore();
    store = create();
    await store.init();
    await clear(store);
  });

  afterAll(() => {
    resetStore();
  });

  const add = (name: string, section: "2pm" | "3pm" = "2pm") =>
    store.createStudent({
      name,
      nameKey: name.toLowerCase(),
      section,
      passwordHash: null,
    });

  describe("students", () => {
    it("round-trips a new student", async () => {
      const created = await add("Nadia");

      expect(created.name).toBe("Nadia");
      expect(created.section).toBe("2pm");
      expect(created.pitch).toBeNull();
      expect(created.hasPassword).toBe(false);
    });

    it("returns the existing row when the same name key is created twice", async () => {
      const first = await add("Nadia");
      const second = await add("Nadia");

      expect(second.id).toBe(first.id);
      expect(await store.listStudents()).toHaveLength(1);
    });

    it("finds a student by name key", async () => {
      const created = await add("Nadia");
      const found = await store.findStudentByNameKey("nadia");

      expect(found?.id).toBe(created.id);
    });

    it("returns null for an unknown name key", async () => {
      expect(await store.findStudentByNameKey("nobody")).toBeNull();
    });

    it("exposes the password hash only through the name-key lookup", async () => {
      const created = await add("Nadia");
      await store.setPasswordHash(created.id, "hashed");

      expect(await store.findStudentByNameKey("nadia")).toHaveProperty("passwordHash", "hashed");
      expect(await store.findStudentById(created.id)).not.toHaveProperty("passwordHash");
    });

    it("reports hasPassword once one is set", async () => {
      const created = await add("Nadia");
      await store.setPasswordHash(created.id, "hashed");

      expect((await store.findStudentById(created.id))?.hasPassword).toBe(true);
    });

    it("saves a pitch", async () => {
      const created = await add("Nadia");
      const updated = await store.updatePitch(created.id, "A packet-routing sandbox.");

      expect(updated.pitch).toBe("A packet-routing sandbox.");
      expect((await store.findStudentById(created.id))?.pitch).toBe("A packet-routing sandbox.");
    });

    it("throws when updating a pitch for someone who is gone", async () => {
      await expect(
        store.updatePitch("3f1c9b62-0000-4000-8000-000000000000", "orphan"),
      ).rejects.toThrow();
    });
  });

  describe("ranked preferences", () => {
    it("preserves order across a write and read", async () => {
      const nadia = await add("Nadia");
      const marcus = await add("Marcus");
      const priya = await add("Priya");

      await store.replacePreferences(nadia.id, [priya.id, marcus.id]);

      expect(await store.listPreferences(nadia.id)).toEqual([priya.id, marcus.id]);
    });

    it("writes dense 1-based ranks", async () => {
      const nadia = await add("Nadia");
      const marcus = await add("Marcus");
      const priya = await add("Priya");

      await store.replacePreferences(nadia.id, [priya.id, marcus.id]);
      const edges = await store.listAllPreferences();

      expect(edges).toEqual([
        { studentId: nadia.id, targetId: priya.id, rank: 1 },
        { studentId: nadia.id, targetId: marcus.id, rank: 2 },
      ]);
    });

    it("survives a reversal", async () => {
      const nadia = await add("Nadia");
      const marcus = await add("Marcus");
      const priya = await add("Priya");

      await store.replacePreferences(nadia.id, [priya.id, marcus.id]);
      await store.replacePreferences(nadia.id, [marcus.id, priya.id]);

      expect(await store.listPreferences(nadia.id)).toEqual([marcus.id, priya.id]);
    });

    it("drops duplicates while keeping the first position", async () => {
      const nadia = await add("Nadia");
      const marcus = await add("Marcus");

      await store.replacePreferences(nadia.id, [marcus.id, marcus.id]);

      expect(await store.listPreferences(nadia.id)).toEqual([marcus.id]);
    });

    it("refuses to store a self-reference", async () => {
      const nadia = await add("Nadia");

      await store.replacePreferences(nadia.id, [nadia.id]);

      expect(await store.listPreferences(nadia.id)).toEqual([]);
    });

    it("clears a ranking when given an empty list", async () => {
      const nadia = await add("Nadia");
      const marcus = await add("Marcus");

      await store.replacePreferences(nadia.id, [marcus.id]);
      await store.replacePreferences(nadia.id, []);

      expect(await store.listPreferences(nadia.id)).toEqual([]);
    });

    it("keeps students' rankings independent", async () => {
      const nadia = await add("Nadia");
      const marcus = await add("Marcus");
      const priya = await add("Priya");

      await store.replacePreferences(nadia.id, [marcus.id, priya.id]);
      await store.replacePreferences(priya.id, [nadia.id]);

      expect(await store.listPreferences(nadia.id)).toEqual([marcus.id, priya.id]);
      expect(await store.listPreferences(priya.id)).toEqual([nadia.id]);
    });

    it("removes a student's edges when they are deleted by a section move", async () => {
      const nadia = await add("Nadia");
      const marcus = await add("Marcus");

      await store.replacePreferences(nadia.id, [marcus.id]);
      await store.moveToSection(nadia.id, "3pm");

      expect(await store.listPreferences(nadia.id)).toEqual([]);
    });
  });

  describe("moving sections", () => {
    it("records the new section", async () => {
      const nadia = await add("Nadia");
      const moved = await store.moveToSection(nadia.id, "3pm");

      expect(moved.section).toBe("3pm");
      expect((await store.findStudentById(nadia.id))?.section).toBe("3pm");
    });

    it("keeps the pitch, which is still theirs", async () => {
      const nadia = await add("Nadia");
      await store.updatePitch(nadia.id, "A type checker.");

      const moved = await store.moveToSection(nadia.id, "3pm");
      expect(moved.pitch).toBe("A type checker.");
    });

    it("removes the mover from other students' rankings", async () => {
      const nadia = await add("Nadia");
      const marcus = await add("Marcus");
      const priya = await add("Priya");

      await store.replacePreferences(priya.id, [nadia.id, marcus.id]);
      await store.moveToSection(nadia.id, "3pm");

      expect(await store.listPreferences(priya.id)).toEqual([marcus.id]);
    });

    it("closes the rank gap the mover leaves behind", async () => {
      const nadia = await add("Nadia");
      const marcus = await add("Marcus");
      const priya = await add("Priya");
      const fionn = await add("Fionn");

      // Nadia is Priya's first choice; removing her must promote the rest
      // rather than leaving rank 1 empty.
      await store.replacePreferences(priya.id, [nadia.id, marcus.id, fionn.id]);
      await store.moveToSection(nadia.id, "3pm");

      const edges = (await store.listAllPreferences()).filter(
        (edge) => edge.studentId === priya.id,
      );

      expect(edges).toEqual([
        { studentId: priya.id, targetId: marcus.id, rank: 1 },
        { studentId: priya.id, targetId: fionn.id, rank: 2 },
      ]);
    });

    it("leaves unrelated rankings untouched", async () => {
      const nadia = await add("Nadia");
      const marcus = await add("Marcus");
      const priya = await add("Priya");
      const fionn = await add("Fionn");

      await store.replacePreferences(marcus.id, [priya.id, fionn.id]);
      await store.moveToSection(nadia.id, "3pm");

      const edges = (await store.listAllPreferences()).filter(
        (edge) => edge.studentId === marcus.id,
      );
      expect(edges.map((edge) => edge.rank)).toEqual([1, 2]);
    });

    it("throws for a student who does not exist", async () => {
      await expect(
        store.moveToSection("3f1c9b62-0000-4000-8000-000000000000", "3pm"),
      ).rejects.toThrow();
    });
  });

  describe("settings", () => {
    it("returns null for an unset key", async () => {
      expect(await store.getSetting("locked")).toBeNull();
    });

    it("round-trips a value", async () => {
      await store.setSetting("locked", "closed");
      expect(await store.getSetting("locked")).toBe("closed");
    });

    it("overwrites on a second write", async () => {
      await store.setSetting("locked", "closed");
      await store.setSetting("locked", "open");

      expect(await store.getSetting("locked")).toBe("open");
    });
  });
});
