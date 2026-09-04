import { Card } from "@/components/ui/card";
import type { AdminView } from "@/lib/services/admin-service";

export function StatsPanel({ stats }: { stats: AdminView["stats"] }) {
  const items = [
    { label: "Signed in", value: stats.students },
    { label: "Pitches shared", value: stats.pitches },
    { label: "Selections made", value: stats.selections },
    { label: "Mutual pairs", value: stats.mutualPairs },
  ];

  return (
    <div className="grid grid-cols-2 gap-2 lg:grid-cols-4">
      {items.map((item) => (
        <Card key={item.label} as="div" className="p-6">
          <p className="label">{item.label}</p>
          <p className="mt-6 text-2xl tabular-nums tracking-[0.06em]">{item.value}</p>
        </Card>
      ))}
    </div>
  );
}
