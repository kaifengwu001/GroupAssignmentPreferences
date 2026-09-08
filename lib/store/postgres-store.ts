import { Pool, type PoolClient } from "pg";

import { isSectionId, type SectionId } from "@/lib/sections";

import { MIGRATIONS } from "./migrations";
import type {
  CreateStudentInput,
  PreferenceEdge,
  Store,
  Student,
  StudentWithSecret,
} from "./types";

type StudentRow = {
  id: string;
  name: string;
  name_key: string;
  section: string | null;
  password_hash: string | null;
  pitch: string | null;
  created_at: Date;
  updated_at: Date;
};

function toStudent(row: StudentRow): Student {
  return {
    id: row.id,
    name: row.name,
    nameKey: row.name_key,
    // Guard against a value that predates or outlives the current section list.
    section: isSectionId(row.section) ? row.section : null,
    pitch: row.pitch,
    hasPassword: row.password_hash !== null,
    createdAt: row.created_at.toISOString(),
    updatedAt: row.updated_at.toISOString(),
  };
}

function toStudentWithSecret(row: StudentRow): StudentWithSecret {
  return { ...toStudent(row), passwordHash: row.password_hash };
}

/**
 * Managed Postgres (Neon, Supabase, RDS) terminates TLS, while a local
 * container almost never does. Infer from the host and let DATABASE_SSL
 * override when the guess is wrong.
 */
function sslConfig(connectionString: string) {
  const mode = process.env.DATABASE_SSL;
  if (mode === "disable") return undefined;
  if (mode === "require") return { rejectUnauthorized: true };

  const isLoopback = /@(localhost|127\.0\.0\.1|\[::1\])[:/]/.test(connectionString);
  return isLoopback ? undefined : { rejectUnauthorized: true };
}

/** Postgres-backed store. Works with any Postgres 13+ (needs gen_random_uuid). */
export function createPostgresStore(connectionString: string): Store {
  const pool = new Pool({
    connectionString,
    ssl: sslConfig(connectionString),
    // Serverless instances are short-lived and numerous; keep each one's
    // footprint small and let the platform's pooler do the real multiplexing.
    max: 4,
    idleTimeoutMillis: 10_000,
    connectionTimeoutMillis: 10_000,
  });

  async function query<T>(text: string, values: readonly unknown[] = []): Promise<T[]> {
    const result = await pool.query(text, values as unknown[]);
    return result.rows as T[];
  }

  async function withTransaction<T>(work: (client: PoolClient) => Promise<T>): Promise<T> {
    const client = await pool.connect();

    try {
      await client.query("BEGIN");
      const result = await work(client);
      await client.query("COMMIT");
      return result;
    } catch (error) {
      await client.query("ROLLBACK").catch(() => {
        // The connection is already broken; the original error is the useful one.
      });
      throw error;
    } finally {
      client.release();
    }
  }

  return {
    async init() {
      for (const statement of MIGRATIONS) {
        await pool.query(statement);
      }
    },

    async findStudentByNameKey(nameKey) {
      const rows = await query<StudentRow>(
        "SELECT * FROM students WHERE name_key = $1 LIMIT 1",
        [nameKey],
      );
      return rows.length > 0 ? toStudentWithSecret(rows[0]) : null;
    },

    async findStudentById(id) {
      const rows = await query<StudentRow>("SELECT * FROM students WHERE id = $1 LIMIT 1", [
        id,
      ]);
      return rows.length > 0 ? toStudent(rows[0]) : null;
    },

    async listStudents() {
      const rows = await query<StudentRow>("SELECT * FROM students ORDER BY name ASC");
      return rows.map(toStudent);
    },

    async createStudent(input: CreateStudentInput) {
      // If two devices race on the same new name, the loser gets the existing
      // row back rather than a unique-violation error.
      const rows = await query<StudentRow>(
        `INSERT INTO students (name, name_key, section, password_hash)
         VALUES ($1, $2, $3, $4)
         ON CONFLICT (name_key) DO UPDATE SET name = students.name
         RETURNING *`,
        [input.name, input.nameKey, input.section, input.passwordHash],
      );
      return toStudent(rows[0]);
    },

    async setPasswordHash(studentId, passwordHash) {
      await query(
        "UPDATE students SET password_hash = $1, updated_at = now() WHERE id = $2",
        [passwordHash, studentId],
      );
    },

    async updatePitch(studentId, pitch) {
      const rows = await query<StudentRow>(
        "UPDATE students SET pitch = $1, updated_at = now() WHERE id = $2 RETURNING *",
        [pitch, studentId],
      );

      if (rows.length === 0) {
        throw new Error(`updatePitch: student ${studentId} no longer exists`);
      }
      return toStudent(rows[0]);
    },

    async moveToSection(studentId: string, section: SectionId) {
      return withTransaction(async (client) => {
        const updated = await client.query(
          "UPDATE students SET section = $1, updated_at = now() WHERE id = $2 RETURNING *",
          [section, studentId],
        );

        if (updated.rows.length === 0) {
          throw new Error(`moveToSection: student ${studentId} no longer exists`);
        }

        // Whose ranking is about to develop a hole. Captured before the delete,
        // because afterwards there is nothing left to identify them by.
        const affected = await client.query<{ student_id: string }>(
          "SELECT DISTINCT student_id FROM preferences WHERE target_id = $1 AND student_id <> $1",
          [studentId],
        );

        // Every edge in or out now crosses a section boundary, so drop them all.
        await client.query(
          "DELETE FROM preferences WHERE student_id = $1 OR target_id = $1",
          [studentId],
        );

        // Close the gaps. rank has to stay a dense 1..n run: the CSV export
        // reads it as choice_1, choice_2, ... so a hole at 1 would report
        // somebody's top pick as their second.
        const owners = affected.rows.map((row) => row.student_id);
        if (owners.length > 0) {
          await client.query(
            `UPDATE preferences AS p
                SET rank = renumbered.position
               FROM (
                 SELECT student_id,
                        target_id,
                        row_number() OVER (PARTITION BY student_id ORDER BY rank) AS position
                   FROM preferences
                  WHERE student_id = ANY($1::uuid[])
               ) AS renumbered
              WHERE p.student_id = renumbered.student_id
                AND p.target_id = renumbered.target_id`,
            [owners],
          );
        }

        return toStudent(updated.rows[0] as StudentRow);
      });
    },

    async listPreferences(studentId) {
      const rows = await query<{ target_id: string }>(
        "SELECT target_id FROM preferences WHERE student_id = $1 ORDER BY rank ASC",
        [studentId],
      );
      return rows.map((row) => row.target_id);
    },

    async listAllPreferences() {
      const rows = await query<{ student_id: string; target_id: string; rank: number }>(
        "SELECT student_id, target_id, rank FROM preferences ORDER BY student_id, rank ASC",
      );
      return rows.map(
        (row): PreferenceEdge => ({
          studentId: row.student_id,
          targetId: row.target_id,
          rank: row.rank,
        }),
      );
    },

    async replacePreferences(studentId, orderedTargetIds) {
      const unique = [...new Set(orderedTargetIds)].filter((id) => id !== studentId);

      // One transaction, so a concurrent reader never sees the gap between
      // clearing the old selection set and writing the new one. WITH ORDINALITY
      // turns array position into a dense 1-based rank.
      await withTransaction(async (client) => {
        await client.query("DELETE FROM preferences WHERE student_id = $1", [studentId]);

        if (unique.length > 0) {
          await client.query(
            `INSERT INTO preferences (student_id, target_id, rank)
             SELECT $1, target, ordinality
             FROM unnest($2::uuid[]) WITH ORDINALITY AS t(target, ordinality)`,
            [studentId, unique],
          );
        }
      });
    },

    async getSetting(key) {
      const rows = await query<{ value: string }>(
        "SELECT value FROM settings WHERE key = $1 LIMIT 1",
        [key],
      );
      return rows.length > 0 ? rows[0].value : null;
    },

    async setSetting(key, value) {
      await query(
        `INSERT INTO settings (key, value)
         VALUES ($1, $2)
         ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = now()`,
        [key, value],
      );
    },
  };
}
