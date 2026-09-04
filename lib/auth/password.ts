import { randomBytes, scrypt, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";

const scryptAsync = promisify(scrypt) as (
  password: string,
  salt: Buffer,
  keylen: number,
) => Promise<Buffer>;

const KEY_LENGTH = 64;
const SALT_LENGTH = 16;
const PREFIX = "scrypt";

/**
 * Passwords are hashed with scrypt from the Node standard library, so there is
 * no native dependency to build. Stored as `scrypt$<saltBase64>$<hashBase64>`.
 */
export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(SALT_LENGTH);
  const derived = await scryptAsync(password, salt, KEY_LENGTH);
  return [PREFIX, salt.toString("base64"), derived.toString("base64")].join("$");
}

export async function verifyPassword(password: string, stored: string): Promise<boolean> {
  const parts = stored.split("$");
  if (parts.length !== 3 || parts[0] !== PREFIX) return false;

  const salt = Buffer.from(parts[1], "base64");
  const expected = Buffer.from(parts[2], "base64");
  if (expected.length !== KEY_LENGTH) return false;

  const derived = await scryptAsync(password, salt, KEY_LENGTH);
  return timingSafeEqual(derived, expected);
}

/** Constant-time comparison for the shared admin password. */
export function matchesSecret(candidate: string, secret: string): boolean {
  const a = Buffer.from(candidate, "utf8");
  const b = Buffer.from(secret, "utf8");

  // timingSafeEqual throws on length mismatch, so compare a fixed-width digest
  // of both values instead of returning early on length alone.
  if (a.length !== b.length) {
    // Still perform work to avoid leaking length through response time.
    timingSafeEqual(b, b);
    return false;
  }

  return timingSafeEqual(a, b);
}
