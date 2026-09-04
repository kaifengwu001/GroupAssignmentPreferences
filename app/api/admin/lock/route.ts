import { requireAdmin } from "@/lib/api/guards";
import { handle, ok, parseJson } from "@/lib/api/respond";
import { setLocked } from "@/lib/services/lock-service";
import { lockSchema } from "@/lib/validation/schemas";

export async function PUT(request: Request) {
  return handle(async () => {
    await requireAdmin();
    const { locked } = await parseJson(request, lockSchema);
    await setLocked(locked);

    return ok({ locked });
  });
}
