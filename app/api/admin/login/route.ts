import { clientKey, enforceRateLimit } from "@/lib/api/rate-limit";
import { handle, ok, parseJson } from "@/lib/api/respond";
import { matchesSecret } from "@/lib/auth/password";
import { startAdminSession } from "@/lib/auth/session";
import { adminPassword } from "@/lib/config";
import { AppError } from "@/lib/errors";
import { adminLoginSchema } from "@/lib/validation/schemas";

export async function POST(request: Request) {
  return handle(async () => {
    enforceRateLimit(clientKey(request, "admin-login"), 10, 60_000);

    const secret = adminPassword();
    if (!secret) {
      throw new AppError(
        "internal",
        503,
        "ADMIN_PASSWORD is not configured. Set it in your environment and redeploy.",
      );
    }

    const { password } = await parseJson(request, adminLoginSchema);
    if (!matchesSecret(password, secret)) {
      throw new AppError("wrong_password", 401, "Incorrect admin password.");
    }

    await startAdminSession();
    return ok({ signedIn: true });
  });
}
