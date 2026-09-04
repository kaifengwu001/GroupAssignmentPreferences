import { cookies } from "next/headers";
import { SignJWT, jwtVerify } from "jose";

import { isProduction, sessionSecret } from "@/lib/config";

/**
 * Sessions are stateless signed cookies. A student session carries only the
 * student id; everything else is read from the store on each request so a
 * renamed or removed student cannot keep acting on stale claims.
 */

export const STUDENT_COOKIE = "sp_session";
export const ADMIN_COOKIE = "sp_admin";

const ALGORITHM = "HS256";
const STUDENT_TTL = "30d";
const ADMIN_TTL = "12h";
const STUDENT_MAX_AGE = 60 * 60 * 24 * 30;
const ADMIN_MAX_AGE = 60 * 60 * 12;

async function sign(payload: Record<string, string>, ttl: string): Promise<string> {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: ALGORITHM })
    .setIssuedAt()
    .setExpirationTime(ttl)
    .sign(sessionSecret());
}

async function read(token: string | undefined): Promise<Record<string, unknown> | null> {
  if (!token) return null;

  try {
    const { payload } = await jwtVerify(token, sessionSecret(), { algorithms: [ALGORITHM] });
    return payload;
  } catch {
    // Expired, tampered with, or signed by an older secret: treat as signed out.
    return null;
  }
}

function cookieOptions(maxAge: number) {
  return {
    httpOnly: true,
    secure: isProduction(),
    sameSite: "lax" as const,
    path: "/",
    maxAge,
  };
}

export async function startStudentSession(studentId: string): Promise<void> {
  const token = await sign({ sid: studentId, role: "student" }, STUDENT_TTL);
  (await cookies()).set(STUDENT_COOKIE, token, cookieOptions(STUDENT_MAX_AGE));
}

export async function currentStudentId(): Promise<string | null> {
  const token = (await cookies()).get(STUDENT_COOKIE)?.value;
  const payload = await read(token);

  if (!payload || payload.role !== "student") return null;
  return typeof payload.sid === "string" ? payload.sid : null;
}

export async function endStudentSession(): Promise<void> {
  (await cookies()).delete(STUDENT_COOKIE);
}

export async function startAdminSession(): Promise<void> {
  const token = await sign({ role: "admin" }, ADMIN_TTL);
  (await cookies()).set(ADMIN_COOKIE, token, cookieOptions(ADMIN_MAX_AGE));
}

export async function isAdmin(): Promise<boolean> {
  const token = (await cookies()).get(ADMIN_COOKIE)?.value;
  const payload = await read(token);
  return payload?.role === "admin";
}

export async function endAdminSession(): Promise<void> {
  (await cookies()).delete(ADMIN_COOKIE);
}
