import { requireStudentId } from "@/lib/api/guards";
import { handle, ok } from "@/lib/api/respond";
import { getSectionView } from "@/lib/services/section-service";

/** Polled by the section screen to keep pitches live. */
export const dynamic = "force-dynamic";

export async function GET() {
  return handle(async () => {
    const studentId = await requireStudentId();
    return ok(await getSectionView(studentId));
  });
}
