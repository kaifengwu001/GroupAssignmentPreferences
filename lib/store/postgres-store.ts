import { neon } from "@neondatabase/serverless";

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
  password_hash: string | null;
  pitch: string | null;
  created_at: string | Date;
  updated_at: string | Date;
};

function asIso(value: string | Date): string {
  return value instanceof Date ? value.toISOString() : new Date(value).toISOString();
}

function toStudent(row: StudentRow): Student {
  return {
    id: row.id,
    name: row.name,
    nameKey: row.name_key,
    pitch: row.pitch,
    hasPassword: row.password_hash !== null,
    createdAt: asIso(row.created_at),
    updatedAt: asIso(row.updated_at),
  };
}

function toStudentWithSecret(row: StudentRow): StudentWithSecret {
  return { ...toStudent(row), passwordHash: row.password_hash };
}

/** Postgres-backed store. Works against Neon, Supabase, or any Postgres 13+. */
export function createPostgresStore(connectionString: string): Store {
  const sql = neon(connectionString);

  return {
    async init() {
      for (const statement of MIGRATIONS) {
        await sql.query(statement);
      }
    },

    async findStudentByNameKey(nameKey) {
      const rows = (await sql`
        SELECT * FROM students WHERE name_key = ${nameKey} LIMIT 1
      `) as StudentRow[];
      return rows.length > 0 ? toStudentWithSecret(rows[0]) : null;
    },

    async findStudentById(id) {
      const rows = (await sql`
        SELECT * FROM students WHERE id = ${id}::uuid LIMIT 1
      `) as StudentRow[];
      return rows.length > 0 ? toStudent(rows[0]) : null;
    },

    async listStudents() {
      const rows = (await sql`
        SELECT * FROM students ORDER BY name ASC
      `) as StudentRow[];
      return rows.map(toStudent);
    },

    async createStudent(input: CreateStudentInput) {
      const rows = (await sql`
        INSERT INTO students (name, name_key, password_hash)
        VALUES (${input.name}, ${input.nameKey}, ${input.passwordHash})
        ON CONFLICT (name_key) DO UPDATE SET name = students.name
        RETURNING *
      `) as StudentRow[];
      return toStudent(rows[0]);
    },

    async setPasswordHash(studentId, passwordHash) {
      await sql`
        UPDATE students
        SET password_hash = ${passwordHash}, updated_at = now()
        WHERE id = ${studentId}::uuid
      `;
    },

    async updatePitch(studentId, pitch) {
      const rows = (await sql`
        UPDATE students
        SET pitch = ${pitch}, updated_at = now()
        WHERE id = ${studentId}::uuid
        RETURNING *
      `) as StudentRow[];

      if (rows.length === 0) {
        throw new Error(`updatePitch: student ${studentId} no longer exists`);
      }
      return toStudent(rows[0]);
    },

    async listPreferences(studentId) {
      const rows = (await sql`
        SELECT target_id FROM preferences WHERE student_id = ${studentId}::uuid
      `) as { target_id: string }[];
      return rows.map((row) => row.target_id);
    },

    async listAllPreferences() {
      const rows = (await sql`
        SELECT student_id, target_id FROM preferences
      `) as { student_id: string; target_id: string }[];
      return rows.map(
        (row): PreferenceEdge => ({ studentId: row.student_id, targetId: row.target_id }),
      );
    },

    async replacePreferences(studentId, targetIds) {
      const unique = [...new Set(targetIds)].filter((id) => id !== studentId);

      // Both statements ship in one transaction so a reader never observes the
      // gap between clearing the old set and writing the new one.
      const statements = [
        sql`DELETE FROM preferences WHERE student_id = ${studentId}::uuid`,
      ];

      if (unique.length > 0) {
        statements.push(sql`
          INSERT INTO preferences (student_id, target_id)
          SELECT ${studentId}::uuid, target
          FROM unnest(${unique}::uuid[]) AS target
          ON CONFLICT DO NOTHING
        `);
      }

      await sql.transaction(statements);
    },

    async getSetting(key) {
      const rows = (await sql`
        SELECT value FROM settings WHERE key = ${key} LIMIT 1
      `) as { value: string }[];
      return rows.length > 0 ? rows[0].value : null;
    },

    async setSetting(key, value) {
      await sql`
        INSERT INTO settings (key, value)
        VALUES (${key}, ${value})
        ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = now()
      `;
    },
  };
}
