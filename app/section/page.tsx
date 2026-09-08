import { redirect } from "next/navigation";

import { SectionBoard } from "@/components/section-board";
import { PageShell } from "@/components/ui/page-shell";
import { currentStudentId } from "@/lib/auth/session";
import { closesAt, sectionTitle } from "@/lib/config";
import { formatDateTime, timeRemaining } from "@/lib/dates";
import { isLocked } from "@/lib/services/lock-service";
import { getSectionView } from "@/lib/services/section-service";

export const dynamic = "force-dynamic";

export default async function SectionPage() {
  if (await isLocked()) redirect("/locked");

  const studentId = await currentStudentId();
  if (!studentId) redirect("/join");

  // A signed cookie can outlive the student record it points at, and a student
  // may predate sections; both land back on sign-in.
  const view = await getSectionView(studentId).catch(() => null);
  if (!view) redirect("/join");

  // Reading the section is earned by contributing a pitch first.
  if (!view.me.pitch) redirect("/pitch");

  const closes = closesAt();

  return (
    <PageShell title={sectionTitle()} subtitle="Live pitches" accent>
      <SectionBoard
        initial={view}
        closesLabel={closes ? formatDateTime(closes) : null}
        remaining={closes ? timeRemaining(closes) : null}
      />
    </PageShell>
  );
}
