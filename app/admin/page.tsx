import { headers } from "next/headers";

import { AdminLogin } from "@/components/admin/admin-login";
import { ExportPanel } from "@/components/admin/export-panel";
import { LockPanel } from "@/components/admin/lock-panel";
import { QrPanel } from "@/components/admin/qr-panel";
import { RosterTable } from "@/components/admin/roster-table";
import { StatsPanel } from "@/components/admin/stats-panel";
import { PageShell } from "@/components/ui/page-shell";
import { isAdmin } from "@/lib/auth/session";
import { adminPassword, sectionTitle } from "@/lib/config";
import { originFromHeaders, qrDataUrl } from "@/lib/qr";
import { getAdminView } from "@/lib/services/admin-service";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const title = sectionTitle();

  if (!(await isAdmin())) {
    return (
      <PageShell title={title} subtitle="Admin">
        <AdminLogin configured={adminPassword() !== null} />
      </PageShell>
    );
  }

  const view = await getAdminView();
  const origin = originFromHeaders(await headers());
  const qr = await qrDataUrl(origin);

  return (
    <PageShell title={title} subtitle="Admin" accent={view.locked}>
      <div className="flex flex-col gap-2">
        <StatsPanel stats={view.stats} />

        <div className="grid gap-2 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <LockPanel locked={view.locked} />
          </div>
          <QrPanel url={origin} dataUrl={qr} />
        </div>

        <ExportPanel persistent={view.persistent} />
        <RosterTable rows={view.rows} />
      </div>
    </PageShell>
  );
}
