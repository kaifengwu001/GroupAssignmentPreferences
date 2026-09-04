import { sortByName } from "@/lib/names";

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
  preferences: Map<string, ReadonlySet<string>>;
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

    async listPreferences(studentId) {
      return [...(state().preferences.get(studentId) ?? new Set<string>())];
    },

    async listAllPreferences() {
      const edges: PreferenceEdge[] = [];

      for (const [studentId, targets] of state().preferences.entries()) {
        for (const targetId of targets) {
          edges.push({ studentId, targetId });
        }
      }

      return edges;
    },

    async replacePreferences(studentId, targetIds) {
      const unique = new Set([...targetIds].filter((id) => id !== studentId));
      state().preferences.set(studentId, unique);
    },

    async getSetting(key) {
      return state().settings.get(key) ?? null;
    },

    async setSetting(key, value) {
      state().settings.set(key, value);
    },
  };
}
