import { redirect } from "next/navigation";

import { AccentDot, Card } from "@/components/ui/card";
import { PageShell } from "@/components/ui/page-shell";
import { resultsAt, sectionTitle } from "@/lib/config";
import { formatDate } from "@/lib/dates";
import { isLocked } from "@/lib/services/lock-service";

export const dynamic = "force-dynamic";

/** Terminal state once the deadline passes or the instructor closes early. */
export default async function LockedPage() {
  if (!(await isLocked())) redirect("/");

  const results = resultsAt();

  return (
    <PageShell title={sectionTitle()} subtitle="Closed">
      <Card className="flex min-h-[18rem] flex-col justify-between">
        <AccentDot />

        <div>
          <p className="index-mark mb-6">00</p>
          <h2 className="text-lg uppercase leading-tight tracking-[0.16em] sm:text-xl">
            Preferences have been
            <br />
            locked in
          </h2>
          <p className="label mt-6 max-w-md normal-case tracking-[0.08em]">
            Sign-in is closed and no further changes can be made. Your instructor has
            everything they need to form groups.
          </p>
          <p className="label mt-4 max-w-md normal-case tracking-[0.08em] text-ink-faint">
            {results
              ? `Groups will be announced in section on ${formatDate(results)}. There is nothing to check for here.`
              : "Groups will be announced in section."}
          </p>
        </div>
      </Card>
    </PageShell>
  );
}
