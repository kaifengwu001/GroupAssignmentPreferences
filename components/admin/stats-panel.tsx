import { Card, CardHeader } from "@/components/ui/card";
import type { AdminGroup, SectionStats } from "@/lib/services/admin-service";

/** Per-section counts side by side, since the two sections run independently. */
export function StatsPanel({
  groups,
  totals,
}: {
  groups: readonly AdminGroup[];
  totals: SectionStats;
}) {
  return (
    <div className="grid gap-2 lg:grid-cols-3">
      {groups.map((group) => (
        <Card key={group.id} as="div">
          <CardHeader title={`${group.label} section`} />
          <StatGrid stats={group.stats} />
        </Card>
      ))}

      <Card as="div">
        <CardHeader title="Both sections" />
        <StatGrid stats={totals} />
      </Card>
    </div>
  );
}

function StatGrid({ stats }: { stats: SectionStats }) {
  const items = [
    { label: "Signed in", value: stats.students },
    { label: "Pitches", value: stats.pitches },
    { label: "Choices", value: stats.selections },
    { label: "Mutual pairs", value: stats.mutualPairs },
  ];

  return (
    <dl className="grid grid-cols-2 gap-x-4 gap-y-6">
      {items.map((item) => (
        <div key={item.label}>
          <dt className="label">{item.label}</dt>
          <dd className="mt-1 text-xl tabular-nums tracking-[0.06em]">{item.value}</dd>
        </div>
      ))}
    </dl>
  );
}
