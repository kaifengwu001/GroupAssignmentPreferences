import { validationFailed } from "@/lib/errors";
import { getStore } from "@/lib/store";

import { assertUnlocked } from "./lock-service";

/**
 * Selections are stored as a set and replaced wholesale, so saving is
 * idempotent and the client can simply send its current checkbox state.
 * There is no cap on how many peers a student may choose.
 */
export async function savePreferences(
  studentId: string,
  targetIds: readonly string[],
): Promise<readonly string[]> {
  await assertUnlocked();

  const store = await getStore();
  const students = await store.listStudents();
  const validIds = new Set(
    students.filter((student) => student.id !== studentId).map((student) => student.id),
  );

  // A client echoing back its own id is harmless, so drop it quietly rather
  // than failing the whole save.
  const requested = [...new Set(targetIds)].filter((id) => id !== studentId);
  const unknown = requested.filter((id) => !validIds.has(id));

  if (unknown.length > 0) {
    throw validationFailed(
      "Some selections are no longer in the section. Refresh the page and try again.",
    );
  }

  await store.replacePreferences(studentId, requested);
  return requested;
}
