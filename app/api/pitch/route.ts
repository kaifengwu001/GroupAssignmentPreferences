import { requireStudentId } from "@/lib/api/guards";
import { handle, ok, parseJson } from "@/lib/api/respond";
import { savePitch } from "@/lib/services/pitch-service";
import { pitchSchema } from "@/lib/validation/schemas";

export async function PUT(request: Request) {
  return handle(async () => {
    const studentId = await requireStudentId();
    const { pitch } = await parseJson(request, pitchSchema);
    const student = await savePitch(studentId, pitch);

    return ok({ pitch: student.pitch, updatedAt: student.updatedAt });
  });
}
