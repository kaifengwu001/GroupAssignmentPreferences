import { locked as lockedError } from "@/lib/errors";
import { getStore } from "@/lib/store";
import { SETTING_LOCKED } from "@/lib/store/types";

/**
 * The lock is a single setting row. Once set, students can neither sign in nor
 * change anything; the instructor dashboard stays available.
 */

export async function isLocked(): Promise<boolean> {
  const store = await getStore();
  return (await store.getSetting(SETTING_LOCKED)) === "true";
}

export async function setLocked(next: boolean): Promise<void> {
  const store = await getStore();
  await store.setSetting(SETTING_LOCKED, next ? "true" : "false");
}

/** Throws the shared locked error when submissions have been closed. */
export async function assertUnlocked(): Promise<void> {
  if (await isLocked()) throw lockedError();
}
