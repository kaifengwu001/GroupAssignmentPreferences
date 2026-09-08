import { Card, CardHeader } from "@/components/ui/card";

/**
 * The two dates that matter. Rendered from server-formatted strings so every
 * student sees one timezone regardless of their device.
 */
export function KeyDates({
  closesLabel,
  resultsLabel,
  remaining,
}: {
  closesLabel: string | null;
  resultsLabel: string | null;
  remaining: string | null;
}) {
  return (
    <Card className="flex flex-col">
      <CardHeader index="01" title="Key dates" meta={remaining ?? undefined} />

      <dl className="flex flex-1 flex-col gap-7">
        <div>
          <dt className="label text-ink">Pitching &amp; selection close</dt>
          <dd className="mt-2 text-sm leading-relaxed tracking-[0.01em]">
            {closesLabel ?? "To be announced"}
          </dd>
          <p className="mt-2 text-xs leading-relaxed tracking-[0.02em] text-ink-soft">
            After this the site stops accepting sign-ins and nothing can be changed.
          </p>
        </div>

        <div className="hairline pt-7">
          <dt className="label text-ink">Groups published</dt>
          <dd className="mt-2 text-sm leading-relaxed tracking-[0.01em]">
            {resultsLabel ?? "To be announced"}
          </dd>
          <p className="mt-2 text-xs leading-relaxed tracking-[0.02em] text-ink-soft">
            Announced live in section — there is nothing to check for here afterwards.
          </p>
        </div>
      </dl>
    </Card>
  );
}
