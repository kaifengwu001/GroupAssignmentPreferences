import { redirect } from "next/navigation";

import { PitchForm } from "@/components/pitch-form";
import { PageShell } from "@/components/ui/page-shell";
import { currentStudentId } from "@/lib/auth/session";
import { sectionTitle } from "@/lib/config";
import { isLocked } from "@/lib/services/lock-service";
import { getStore } from "@/lib/store";

export const dynamic = "force-dynamic";

export default async function PitchPage() {
  if (await isLocked()) redirect("/locked");

  const studentId = await currentStudentId();
  if (!studentId) redirect("/");

  const store = await getStore();
  const student = await store.findStudentById(studentId);
  if (!student) redirect("/");

  return (
    <PageShell title={sectionTitle()} subtitle={student.name} accent>
      <PitchForm initialPitch={student.pitch} />
    </PageShell>
  );
}
