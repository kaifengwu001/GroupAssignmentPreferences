import { clientKey, enforceRateLimit } from "@/lib/api/rate-limit";
import { handle, ok, parseJson } from "@/lib/api/respond";
import { startStudentSession } from "@/lib/auth/session";
import { signIn } from "@/lib/services/auth-service";
import { loginSchema } from "@/lib/validation/schemas";

export async function POST(request: Request) {
  return handle(async () => {
    enforceRateLimit(clientKey(request, "login"), 20, 60_000);

    const input = await parseJson(request, loginSchema);
    const student = await signIn(input);
    await startStudentSession(student.id);

    return ok({
      id: student.id,
      name: student.name,
      section: student.section,
      hasPitch: student.pitch !== null,
    });
  });
}
