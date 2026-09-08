import { Card, CardHeader } from "@/components/ui/card";
import type { AdminGroup, RankedName } from "@/lib/services/admin-service";

/** One table per section, with every choice shown in rank order. */
export function RosterTable({ group, index }: { group: AdminGroup; index: string }) {
  return (
    <Card>
      <CardHeader
        index={index}
        title={`${group.label} section`}
        meta={`${group.rows.length} students · ${group.stats.mutualPairs} mutual pairs`}
      />

      {group.rows.length === 0 ? (
        <p className="label normal-case tracking-[0.08em] text-ink-faint">
          Nobody has signed in to this section yet.
        </p>
      ) : (
        <div className="-mx-2 overflow-x-auto">
          <table className="w-full min-w-[56rem] border-collapse text-left">
            <thead>
              <tr className="label">
                <Th>Name</Th>
                <Th>Pitch</Th>
                <Th>Their ranking</Th>
                <Th>Chosen by (their rank)</Th>
                <Th>Mutual</Th>
              </tr>
            </thead>
            <tbody>
              {group.rows.map((row) => (
                <tr key={row.id} className="hairline align-top">
                  <Td className="whitespace-nowrap">
                    <span className="uppercase tracking-[0.1em]">{row.name}</span>
                    {row.hasPassword ? (
                      <span className="label mt-1 block text-ink-faint">password set</span>
                    ) : null}
                  </Td>
                  <Td className="max-w-[20rem] text-ink-soft">
                    {row.pitch ?? <span className="text-ink-faint">—</span>}
                  </Td>
                  <Td className="max-w-[16rem]">
                    <RankedNames entries={row.choices} />
                  </Td>
                  <Td className="max-w-[16rem] text-ink-soft">
                    <RankedNames entries={row.chosenBy} />
                  </Td>
                  <Td className="max-w-[12rem]">
                    {row.mutual.length > 0 ? (
                      <span className="text-accent">{row.mutual.join(", ")}</span>
                    ) : (
                      <span className="text-ink-faint">—</span>
                    )}
                  </Td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Card>
  );
}

/** Numbered so rank is never inferred from position alone. */
function RankedNames({ entries }: { entries: readonly RankedName[] }) {
  if (entries.length === 0) return <span className="text-ink-faint">—</span>;

  return (
    <ol className="flex list-none flex-col gap-1 p-0">
      {entries.map((entry) => (
        <li key={`${entry.rank}-${entry.name}`} className="flex gap-2">
          <span className="tabular-nums text-ink-faint">{entry.rank}.</span>
          <span>{entry.name}</span>
        </li>
      ))}
    </ol>
  );
}

function Th({ children, className }: { children: React.ReactNode; className?: string }) {
  return <th className={`px-2 pb-4 font-normal ${className ?? ""}`}>{children}</th>;
}

function Td({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <td className={`px-2 py-4 text-xs leading-relaxed tracking-[0.02em] ${className ?? ""}`}>
      {children}
    </td>
  );
}
