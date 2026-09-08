import { sectionRequired, unauthenticated, validationFailed } from "@/lib/errors";
import { getStore } from "@/lib/store";

import { assertUnlocked } from "./lock-service";

/**
 * Choices are ranked: position in the incoming array is the student's
 * preference order, with index 0 as their first choice. The whole list is
 * replaced on every save, so the client can simply send its current order and
 * saving stays idempotent. There is no cap on how many peers may be ranked.
 */
export async function savePreferences(
  studentId: string,
  orderedTargetIds: readonly string[],
): Promise<readonly string[]> {
  await assertUnlocked();

  const store = await getStore();
  const students = await store.listStudents();

  const me = students.find((student) => student.id === studentId);
  if (!me) throw unauthenticated();
  if (me.section === null) throw sectionRequired();

  // Only same-section classmates are selectable.
  const selectable = new Set(
    students
      .filter((student) => student.section === me.section && student.id !== studentId)
      .map((student) => student.id),
  );

  // Preserve order while dropping duplicates and any self-reference, which a
  // client may harmlessly echo back.
  const seen = new Set<string>();
  const ordered = orderedTargetIds.filter((id) => {
    if (id === studentId || seen.has(id)) return false;
    seen.add(id);
    return true;
  });

  if (ordered.some((id) => !selectable.has(id))) {
    throw validationFailed(
      "Some choices are no longer in your section. Refresh the page and try again.",
    );
  }

  await store.replacePreferences(studentId, ordered);
  return ordered;
}
