/**
 * Schema definition, kept as discrete idempotent statements so it can be
 * applied through drivers that allow only one statement per round trip.
 * `gen_random_uuid()` is built into Postgres 13+, so no extension is required.
 */
export const MIGRATIONS: readonly string[] = [
  `CREATE TABLE IF NOT EXISTS students (
     id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
     name          text NOT NULL,
     name_key      text NOT NULL UNIQUE,
     password_hash text,
     pitch         text,
     created_at    timestamptz NOT NULL DEFAULT now(),
     updated_at    timestamptz NOT NULL DEFAULT now()
   )`,

  // Selections are stored as a set and replaced wholesale on every save, so the
  // composite key doubles as the de-duplication guarantee.
  `CREATE TABLE IF NOT EXISTS preferences (
     student_id uuid NOT NULL REFERENCES students(id) ON DELETE CASCADE,
     target_id  uuid NOT NULL REFERENCES students(id) ON DELETE CASCADE,
     created_at timestamptz NOT NULL DEFAULT now(),
     PRIMARY KEY (student_id, target_id),
     CONSTRAINT preferences_no_self CHECK (student_id <> target_id)
   )`,

  `CREATE INDEX IF NOT EXISTS preferences_target_idx ON preferences (target_id)`,

  `CREATE TABLE IF NOT EXISTS settings (
     key        text PRIMARY KEY,
     value      text NOT NULL,
     updated_at timestamptz NOT NULL DEFAULT now()
   )`,
];
