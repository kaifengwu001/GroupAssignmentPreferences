import { sortByName } from "@/lib/names";
import type { SectionId } from "@/lib/sections";

import type {
  CreateStudentInput,
  PreferenceEdge,
  Store,
  Student,
  StudentWithSecret,
} from "./types";

/**
 * Development-only store so the app runs with zero setup. Records are treated
 * as immutable: updates write a replacement object rather than editing in place.
 *
 * State is parked on globalThis so Next.js hot reloads do not wipe it. Never
 * used in production, where serverless instances would each hold their own copy.
 */

type MemoryState = {
  students: Map<string, StudentWithSecret>;
  /** Ordered best-first, mirroring the rank column in Postgres. */
  preferences: Map<string, readonly string[]>;
  settings: Map<string, string>;
};

const STATE_KEY = "__sectionPitchMemoryState";

function state(): MemoryState {
  const globals = globalThis as typeof globalThis & { [STATE_KEY]?: MemoryState };

  if (!globals[STATE_KEY]) {
    globals[STATE_KEY] = {
      students: new Map(),
      preferences: new Map(),
      settings: new Map(),
    };
  }

  return globals[STATE_KEY];
}

function publicView(student: StudentWithSecret): Student {
  const { passwordHash: _passwordHash, ...rest } = student;
  return { ...rest, hasPassword: student.passwordHash !== null };
}

export function createMemoryStore(): Store {
  return {
    async init() {
      // Nothing to migrate.
    },

    async findStudentByNameKey(nameKey) {
      for (const student of state().students.values()) {
        if (student.nameKey === nameKey) return { ...student };
      }
      return null;
    },

    async findStudentById(id) {
      const student = state().students.get(id);
      return student ? publicView(student) : null;
    },

    async listStudents() {
      return sortByName([...state().students.values()].map(publicView));
    },

    async createStudent(input: CreateStudentInput) {
      const existing = await this.findStudentByNameKey(input.nameKey);
      if (existing) return publicView(existing);

      const now = new Date().toISOString();
      const student: StudentWithSecret = {
        id: crypto.randomUUID(),
        name: input.name,
        nameKey: input.nameKey,
        section: input.section,
        passwordHash: input.passwordHash,
        pitch: null,
        hasPassword: input.passwordHash !== null,
        createdAt: now,
        updatedAt: now,
      };

      state().students.set(student.id, student);
      return publicView(student);
    },

    async setPasswordHash(studentId, passwordHash) {
      const current = state().students.get(studentId);
      if (!current) return;

      state().students.set(studentId, {
        ...current,
        passwordHash,
        hasPassword: true,
        updatedAt: new Date().toISOString(),
      });
    },

    async updatePitch(studentId, pitch) {
      const current = state().students.get(studentId);
      if (!current) {
        throw new Error(`updatePitch: student ${studentId} no longer exists`);
      }

      const next: StudentWithSecret = {
        ...current,
        pitch,
        updatedAt: new Date().toISOString(),
      };
      state().students.set(studentId, next);
      return publicView(next);
    },

    async moveToSection(studentId: string, section: SectionId) {
      const current = state().students.get(studentId);
      if (!current) {
        throw new Error(`moveToSection: student ${studentId} no longer exists`);
      }

      const next: StudentWithSecret = {
        ...current,
        section,
        updatedAt: new Date().toISOString(),
      };
      state().students.set(studentId, next);

      // Drop every edge touching this student; they all cross sections now.
      state().preferences.delete(studentId);
      for (const [ownerId, targets] of state().preferences.entries()) {
        if (targets.includes(studentId)) {
          state().preferences.set(
            ownerId,
            targets.filter((id) => id !== studentId),
          );
        }
      }

      return publicView(next);
    },

    async listPreferences(studentId) {
      return [...(state().preferences.get(studentId) ?? [])];
    },

    async listAllPreferences() {
      const edges: PreferenceEdge[] = [];

      for (const [studentId, targets] of state().preferences.entries()) {
        targets.forEach((targetId, index) => {
          edges.push({ studentId, targetId, rank: index + 1 });
        });
      }

      return edges;
    },

    async replacePreferences(studentId, orderedTargetIds) {
      const seen = new Set<string>();
      const ordered = orderedTargetIds.filter((id) => {
        if (id === studentId || seen.has(id)) return false;
        seen.add(id);
        return true;
      });

      state().preferences.set(studentId, ordered);
    },

    async getSetting(key) {
      return state().settings.get(key) ?? null;
    },

    async setSetting(key, value) {
      state().settings.set(key, value);
    },
  };
}
