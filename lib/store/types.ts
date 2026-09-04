/**
 * Storage contract. Business logic depends only on this interface, which keeps
 * the Postgres driver swappable and makes the in-memory dev store possible.
 * Every method returns fresh objects; callers never receive internal state.
 */

export type Student = {
  readonly id: string;
  readonly name: string;
  readonly nameKey: string;
  readonly pitch: string | null;
  readonly hasPassword: boolean;
  readonly createdAt: string;
  readonly updatedAt: string;
};

/** Only the login path may read the hash, so it lives on a separate type. */
export type StudentWithSecret = Student & {
  readonly passwordHash: string | null;
};

export type PreferenceEdge = {
  readonly studentId: string;
  readonly targetId: string;
};

export type CreateStudentInput = {
  readonly name: string;
  readonly nameKey: string;
  readonly passwordHash: string | null;
};

export interface Store {
  /** Creates tables if needed. Safe to call repeatedly. */
  init(): Promise<void>;

  findStudentByNameKey(nameKey: string): Promise<StudentWithSecret | null>;
  findStudentById(id: string): Promise<Student | null>;
  listStudents(): Promise<readonly Student[]>;
  createStudent(input: CreateStudentInput): Promise<Student>;
  setPasswordHash(studentId: string, passwordHash: string): Promise<void>;
  updatePitch(studentId: string, pitch: string): Promise<Student>;

  listPreferences(studentId: string): Promise<readonly string[]>;
  listAllPreferences(): Promise<readonly PreferenceEdge[]>;
  /** Atomically replaces one student's full selection set. */
  replacePreferences(studentId: string, targetIds: readonly string[]): Promise<void>;

  getSetting(key: string): Promise<string | null>;
  setSetting(key: string, value: string): Promise<void>;
}

export const SETTING_LOCKED = "locked";
