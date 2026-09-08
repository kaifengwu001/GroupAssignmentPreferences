import { allowPasswordClaim, rosterEnforced, rosterFor } from "@/lib/config";
import { hashPassword, verifyPassword } from "@/lib/auth/password";
import { notOnRoster, passwordRequired, wrongPassword, wrongSection } from "@/lib/errors";
import { displayName, normalizeName, toNameKey } from "@/lib/names";
import { SECTION_IDS, sectionLabel, type SectionId } from "@/lib/sections";
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

/**
 * Returns the roster's spelling of a name, in natural order, so the shared
 * list stays tidy no matter how each student typed themselves in.
 */
function resolveRosterName(nameKey: string, section: SectionId): string | null {
  const match = rosterFor(section).find((entry) => toNameKey(entry) === nameKey);
  return match ? displayName(match) : null;
}

/** The section a name actually belongs to, when it is not the one chosen. */
function findRosteredSection(nameKey: string): SectionId | null {
  return SECTION_IDS.find((id) => resolveRosterName(nameKey, id) !== null) ?? null;
}

export async function signIn(input: LoginInput): Promise<Student> {
  await assertUnlocked();

  const typedName = normalizeName(input.name);
  const nameKey = toNameKey(typedName);
  const password = input.password;

  if (nameKey.length === 0) {
    throw notOnRoster(typedName);
  }

  const canonicalName = resolveRosterName(nameKey, input.section);

  if (rosterEnforced() && canonicalName === null) {
    // Naming the right section is far more useful than a bare rejection, since
    // picking the wrong one is the likeliest reason a real student lands here.
    const elsewhere = findRosteredSection(nameKey);
    throw elsewhere
      ? wrongSection(typedName, sectionLabel(elsewhere))
      : notOnRoster(typedName);
  }

  const store = await getStore();
  const existing = await store.findStudentByNameKey(nameKey);

  if (!existing) {
    return store.createStudent({
      name: canonicalName ?? displayName(typedName),
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
