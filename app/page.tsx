import { redirect } from "next/navigation";

import { FinePrint } from "@/components/rules/fine-print";
import { HeroCard } from "@/components/rules/hero-card";
import { HowItWorks } from "@/components/rules/how-it-works";
import { KeyDates } from "@/components/rules/key-dates";
import { PageShell } from "@/components/ui/page-shell";
import { currentStudentId } from "@/lib/auth/session";
import { closesAt, resultsAt, sectionTitle } from "@/lib/config";
import { formatDate, formatDateTime, timeRemaining } from "@/lib/dates";
import { isLocked } from "@/lib/services/lock-service";
import { getStore } from "@/lib/store";

export const dynamic = "force-dynamic";

/** The rules, shown before anyone signs in. Sign-in itself lives at /join. */
export default async function RulesPage() {
  if (await isLocked()) redirect("/locked");

  const studentId = await currentStudentId();
  const student = studentId ? await (await getStore()).findStudentById(studentId) : null;

  // Returning students skip straight back to wherever they left off.
  const continueHref = !student
    ? "/join"
    : student.section === null
      ? "/join"
      : student.pitch
        ? "/section"
        : "/pitch";

  const closes = closesAt();
  const results = resultsAt();

  return (
    <PageShell title={sectionTitle()} subtitle="Project preferences">
      <div className="flex flex-col gap-2">
        <div className="grid gap-2 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <HeroCard signedIn={student !== null} continueHref={continueHref} />
          </div>
          <KeyDates
            closesLabel={closes ? formatDateTime(closes) : null}
            resultsLabel={results ? formatDate(results) : null}
            remaining={closes ? timeRemaining(closes) : null}
          />
        </div>

        <HowItWorks />
        <FinePrint />
      </div>
    </PageShell>
  );
}
