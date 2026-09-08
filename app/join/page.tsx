import Link from "next/link";
import { redirect } from "next/navigation";

import { LoginForm } from "@/components/login-form";
import { KeyDates } from "@/components/rules/key-dates";
import { PageShell } from "@/components/ui/page-shell";
import { currentStudentId } from "@/lib/auth/session";
import { closesAt, resultsAt, rosterEnforced, sectionTitle } from "@/lib/config";
import { formatDate, formatDateTime, timeRemaining } from "@/lib/dates";
import { isLocked } from "@/lib/services/lock-service";
import { getStore } from "@/lib/store";

export const dynamic = "force-dynamic";

export default async function JoinPage() {
  if (await isLocked()) redirect("/locked");

  const studentId = await currentStudentId();
  const student = studentId ? await (await getStore()).findStudentById(studentId) : null;

  const closes = closesAt();
  const results = resultsAt();

  return (
    <PageShell title={sectionTitle()} subtitle="Sign in" accent>
      <div className="grid gap-2 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <LoginForm
            rosterEnforced={rosterEnforced()}
            initialSection={student?.section ?? null}
          />

          <p className="label mt-6 normal-case tracking-[0.08em] text-ink-faint">
            Not sure what this is?{" "}
            <Link href="/" className="underline decoration-line underline-offset-4">
              Read the rules first
            </Link>
            .
          </p>
        </div>

        <KeyDates
          closesLabel={closes ? formatDateTime(closes) : null}
          resultsLabel={results ? formatDate(results) : null}
          remaining={closes ? timeRemaining(closes) : null}
        />
      </div>
    </PageShell>
  );
}
