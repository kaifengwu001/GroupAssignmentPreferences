import { redirect } from "next/navigation";

import { SectionBoard } from "@/components/section-board";
import { PageShell } from "@/components/ui/page-shell";
import { currentStudentId } from "@/lib/auth/session";
import { sectionTitle } from "@/lib/config";
import { isLocked } from "@/lib/services/lock-service";
import { getSectionView } from "@/lib/services/section-service";

export const dynamic = "force-dynamic";

export default async function SectionPage() {
  if (await isLocked()) redirect("/locked");

  const studentId = await currentStudentId();
  if (!studentId) redirect("/");

  // A signed cookie can outlive the student record it points at.
  const view = await getSectionView(studentId).catch(() => null);
  if (!view) redirect("/");

  // Reading the section is earned by contributing a pitch first.
  if (!view.me.pitch) redirect("/pitch");

  return (
    <PageShell title={sectionTitle()} subtitle="Live pitches" accent>
      <SectionBoard initial={view} />
    </PageShell>
  );
}
