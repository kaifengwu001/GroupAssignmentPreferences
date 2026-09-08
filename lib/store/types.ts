import type { SectionId } from "@/lib/sections";

/**
 * Storage contract. Business logic depends only on this interface, which keeps
 * the Postgres driver swappable and makes the in-memory dev store possible.
 * Every method returns fresh objects; callers never receive internal state.
 */

export type Student = {
  readonly id: string;
  readonly name: string;
  readonly nameKey: string;
  /** Null only for rows created before sections existed; forces a re-pick. */
  readonly section: SectionId | null;
  readonly pitch: string | null;
  readonly hasPassword: boolean;
  readonly createdAt: string;
  readonly updatedAt: string;
};

/** Only the login path may read the hash, so it lives on a separate type. */
export type StudentWithSecret = Student & {
  readonly passwordHash: string | null;
};

/** One ranked choice. `rank` is 1-based; 1 is the student's top pick. */
export type PreferenceEdge = {
  readonly studentId: string;
  readonly targetId: string;
  readonly rank: number;
};

export type CreateStudentInput = {
  readonly name: string;
  readonly nameKey: string;
  readonly section: SectionId;
  readonly passwordHash: string | null;
};

export interface Store {
  /** Creates and migrates tables as needed. Safe to call repeatedly. */
  init(): Promise<void>;

  findStudentByNameKey(nameKey: string): Promise<StudentWithSecret | null>;
  findStudentById(id: string): Promise<Student | null>;
  listStudents(): Promise<readonly Student[]>;
  createStudent(input: CreateStudentInput): Promise<Student>;
  setPasswordHash(studentId: string, passwordHash: string): Promise<void>;
  updatePitch(studentId: string, pitch: string): Promise<Student>;

  /**
   * Moves a student to a different section and drops every preference edge
   * touching them, in one transaction — cross-section choices are meaningless.
   */
  moveToSection(studentId: string, section: SectionId): Promise<Student>;

  /** A student's choices, best first. */
  listPreferences(studentId: string): Promise<readonly string[]>;
  listAllPreferences(): Promise<readonly PreferenceEdge[]>;
  /** Atomically replaces one student's ordered selection; index 0 is rank 1. */
  replacePreferences(studentId: string, orderedTargetIds: readonly string[]): Promise<void>;

  getSetting(key: string): Promise<string | null>;
  setSetting(key: string, value: string): Promise<void>;
}

export const SETTING_LOCKED = "locked";
