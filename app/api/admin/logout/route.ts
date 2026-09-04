import { handle, ok } from "@/lib/api/respond";
import { endAdminSession } from "@/lib/auth/session";

export async function POST() {
  return handle(async () => {
    await endAdminSession();
    return ok({ signedOut: true });
  });
}
