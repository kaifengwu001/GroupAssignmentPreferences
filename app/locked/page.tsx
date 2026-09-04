import { redirect } from "next/navigation";

import { AccentDot, Card } from "@/components/ui/card";
import { PageShell } from "@/components/ui/page-shell";
import { sectionTitle } from "@/lib/config";
import { isLocked } from "@/lib/services/lock-service";

export const dynamic = "force-dynamic";

/** Terminal state once the instructor closes submissions. */
export default async function LockedPage() {
  if (!(await isLocked())) redirect("/");

  return (
    <PageShell title={sectionTitle()} subtitle="Closed">
      <Card className="flex min-h-[16rem] flex-col justify-between">
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
        </div>
      </Card>
    </PageShell>
  );
}
