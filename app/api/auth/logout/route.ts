import { handle, ok } from "@/lib/api/respond";
import { endStudentSession } from "@/lib/auth/session";

export async function POST() {
  return handle(async () => {
    await endStudentSession();
    return ok({ signedOut: true });
  });
}
