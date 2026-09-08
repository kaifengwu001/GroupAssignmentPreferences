import { closesAt } from "@/lib/config";
import { locked as lockedError } from "@/lib/errors";
import { getStore } from "@/lib/store";
import { SETTING_LOCKED } from "@/lib/store/types";

/**
 * Two things can close the app: the published deadline passing, or the
 * instructor flipping the switch. A stored override wins over the deadline in
 * both directions, so the instructor can close early or reopen afterwards
 * without a redeploy.
 */

export type LockOverride = "open" | "closed";

export type LockState = {
  readonly locked: boolean;
  readonly reason: "deadline" | "instructor" | null;
  readonly closesAt: Date | null;
  readonly override: LockOverride | null;
};

function parseOverride(value: string | null): LockOverride | null {
  return value === "open" || value === "closed" ? value : null;
}

export async function getLockState(): Promise<LockState> {
  const store = await getStore();
  const override = parseOverride(await store.getSetting(SETTING_LOCKED));
  const deadline = closesAt();
  const deadlinePassed = deadline !== null && Date.now() >= deadline.getTime();

  if (override === "closed") {
    return { locked: true, reason: "instructor", closesAt: deadline, override };
  }
  if (override === "open") {
    return { locked: false, reason: null, closesAt: deadline, override };
  }

  return {
    locked: deadlinePassed,
    reason: deadlinePassed ? "deadline" : null,
    closesAt: deadline,
    override: null,
  };
}

export async function isLocked(): Promise<boolean> {
  return (await getLockState()).locked;
}

export async function setLocked(next: boolean): Promise<void> {
  const store = await getStore();
  await store.setSetting(SETTING_LOCKED, next ? "closed" : "open");
}

/** Throws the shared locked error when submissions have been closed. */
export async function assertUnlocked(): Promise<void> {
  if (await isLocked()) throw lockedError();
}
