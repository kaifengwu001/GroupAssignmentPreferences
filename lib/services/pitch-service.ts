import { notFound } from "@/lib/errors";
import { getStore } from "@/lib/store";
import type { Student } from "@/lib/store/types";

import { assertUnlocked } from "./lock-service";

/** Saves or replaces a student's project pitch. */
export async function savePitch(studentId: string, pitch: string): Promise<Student> {
  await assertUnlocked();

  const store = await getStore();
  const existing = await store.findStudentById(studentId);
  if (!existing) throw notFound("Your record");

  return store.updatePitch(studentId, pitch);
}
