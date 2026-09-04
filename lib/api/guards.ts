import { currentStudentId, isAdmin } from "@/lib/auth/session";
import { AppError, unauthenticated } from "@/lib/errors";

/** Resolves the signed-in student id or throws. */
export async function requireStudentId(): Promise<string> {
  const studentId = await currentStudentId();
  if (!studentId) throw unauthenticated();
  return studentId;
}

/** Throws unless the request carries a valid admin session. */
export async function requireAdmin(): Promise<void> {
  if (!(await isAdmin())) {
    throw new AppError("unauthenticated", 401, "Admin sign-in required.");
  }
}
