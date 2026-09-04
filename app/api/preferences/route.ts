import { requireStudentId } from "@/lib/api/guards";
import { handle, ok, parseJson } from "@/lib/api/respond";
import { savePreferences } from "@/lib/services/preference-service";
import { preferencesSchema } from "@/lib/validation/schemas";

export async function PUT(request: Request) {
  return handle(async () => {
    const studentId = await requireStudentId();
    const { targetIds } = await parseJson(request, preferencesSchema);
    const saved = await savePreferences(studentId, targetIds);

    return ok({ selectedIds: saved, savedAt: new Date().toISOString() });
  });
}
