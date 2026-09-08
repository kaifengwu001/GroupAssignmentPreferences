/**
 * Schema definition, kept as discrete idempotent statements so it can be
 * applied through drivers that allow only one statement per round trip, and
 * re-run safely on every cold start.
 *
 * `gen_random_uuid()` is built into Postgres 13+, so no extension is required.
 * The ADD COLUMN statements let a database created by an earlier version pick
 * up sections and ranked choices without a manual migration step.
 */
export const MIGRATIONS: readonly string[] = [
  `CREATE TABLE IF NOT EXISTS students (
     id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
     name          text NOT NULL,
     name_key      text NOT NULL UNIQUE,
     section       text,
     password_hash text,
     pitch         text,
     created_at    timestamptz NOT NULL DEFAULT now(),
     updated_at    timestamptz NOT NULL DEFAULT now()
   )`,

  `ALTER TABLE students ADD COLUMN IF NOT EXISTS section text`,

  `CREATE INDEX IF NOT EXISTS students_section_idx ON students (section)`,

  // Ranked choices, replaced wholesale on every save. rank is 1-based and
  // dense: 1 is the student's top pick.
  `CREATE TABLE IF NOT EXISTS preferences (
     student_id uuid NOT NULL REFERENCES students(id) ON DELETE CASCADE,
     target_id  uuid NOT NULL REFERENCES students(id) ON DELETE CASCADE,
     rank       integer NOT NULL DEFAULT 1,
     created_at timestamptz NOT NULL DEFAULT now(),
     PRIMARY KEY (student_id, target_id),
     CONSTRAINT preferences_no_self CHECK (student_id <> target_id),
     CONSTRAINT preferences_rank_positive CHECK (rank >= 1)
   )`,

  `ALTER TABLE preferences ADD COLUMN IF NOT EXISTS rank integer NOT NULL DEFAULT 1`,

  `CREATE INDEX IF NOT EXISTS preferences_target_idx ON preferences (target_id)`,

  `CREATE TABLE IF NOT EXISTS settings (
     key        text PRIMARY KEY,
     value      text NOT NULL,
     updated_at timestamptz NOT NULL DEFAULT now()
   )`,
];
