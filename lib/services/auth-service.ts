import { allowPasswordClaim, roster } from "@/lib/config";
import { hashPassword, verifyPassword } from "@/lib/auth/password";
import { notOnRoster, passwordRequired, wrongPassword } from "@/lib/errors";
import { normalizeName, toNameKey } from "@/lib/names";
import { getStore } from "@/lib/store";
import type { Student } from "@/lib/store/types";
import type { LoginInput } from "@/lib/validation/schemas";

import { assertUnlocked } from "./lock-service";

/**
 * Name-based sign-in. There is no email step, so identity rests on the roster
 * (when configured) plus an optional self-set password per name.
 *
 * Password rules:
 *  - A brand new name may set a password at sign-in; it is then required later.
 *  - A name with no password signs in freely, and the first password supplied
 *    claims it (disable with ALLOW_PASSWORD_CLAIM=false).
 *  - A name with a password always requires the matching password.
 */

/** Returns the roster's canonical spelling so the shared list stays tidy. */
function resolveRosterName(nameKey: string): string | null {
  const entries = roster();
  if (entries.length === 0) return null;

  const match = entries.find((entry) => toNameKey(entry) === nameKey);
  return match ? normalizeName(match) : null;
}

export async function signIn(input: LoginInput): Promise<Student> {
  await assertUnlocked();

  const typedName = normalizeName(input.name);
  const nameKey = toNameKey(typedName);
  const password = input.password;

  if (nameKey.length === 0) {
    throw notOnRoster(typedName);
  }

  const rosterEntries = roster();
  const canonicalName = resolveRosterName(nameKey);

  if (rosterEntries.length > 0 && canonicalName === null) {
    throw notOnRoster(typedName);
  }

  const store = await getStore();
  const existing = await store.findStudentByNameKey(nameKey);

  if (!existing) {
    return store.createStudent({
      name: canonicalName ?? typedName,
      nameKey,
      section: input.section,
      passwordHash: password ? await hashPassword(password) : null,
    });
  }

  if (existing.passwordHash !== null) {
    if (!password) throw passwordRequired();
    if (!(await verifyPassword(password, existing.passwordHash))) throw wrongPassword();
  } else if (password && allowPasswordClaim()) {
    await store.setPasswordHash(existing.id, await hashPassword(password));
  }

  // Switching sections invalidates every choice they made or received, so the
  // store clears those edges as part of the move.
  if (existing.section !== input.section) {
    return store.moveToSection(existing.id, input.section);
  }

  const { passwordHash: _passwordHash, ...student } = existing;
  return student;
}
