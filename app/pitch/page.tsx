import { redirect } from "next/navigation";

import { PitchForm } from "@/components/pitch-form";
import { PageShell } from "@/components/ui/page-shell";
import { currentStudentId } from "@/lib/auth/session";
import { sectionTitle } from "@/lib/config";
import { sectionLabel } from "@/lib/sections";
import { isLocked } from "@/lib/services/lock-service";
import { getStore } from "@/lib/store";

export const dynamic = "force-dynamic";

export default async function PitchPage() {
  if (await isLocked()) redirect("/locked");

  const studentId = await currentStudentId();
  if (!studentId) redirect("/join");

  const store = await getStore();
  const student = await store.findStudentById(studentId);
  if (!student) redirect("/join");

  // Pitches belong to a section, so that has to be settled first.
  if (student.section === null) redirect("/join");

  return (
    <PageShell
      title={sectionTitle()}
      subtitle={`${student.name} · ${sectionLabel(student.section)} section`}
      accent
    >
      <PitchForm initialPitch={student.pitch} />
    </PageShell>
  );
}
