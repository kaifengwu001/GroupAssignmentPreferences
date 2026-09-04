import { redirect } from "next/navigation";

import { IntroCard } from "@/components/intro-card";
import { LoginForm } from "@/components/login-form";
import { PageShell } from "@/components/ui/page-shell";
import { currentStudentId } from "@/lib/auth/session";
import { roster, sectionTitle } from "@/lib/config";
import { isLocked } from "@/lib/services/lock-service";
import { getStore } from "@/lib/store";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  if (await isLocked()) redirect("/locked");

  const studentId = await currentStudentId();

  if (studentId) {
    const store = await getStore();
    const student = await store.findStudentById(studentId);
    // Send returning students straight to wherever they left off.
    if (student) redirect(student.pitch ? "/section" : "/pitch");
  }

  return (
    <PageShell title={sectionTitle()} subtitle="Project preferences" accent>
      <div className="grid gap-2 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <LoginForm rosterEnforced={roster().length > 0} />
        </div>
        <IntroCard />
      </div>
    </PageShell>
  );
}
