import { Card, CardHeader } from "@/components/ui/card";
import type { AdminRow } from "@/lib/services/admin-service";

/** Everything at a glance, so groups can be sketched without leaving the page. */
export function RosterTable({ rows }: { rows: readonly AdminRow[] }) {
  return (
    <Card>
      <CardHeader index="04" title="Responses" meta={`${rows.length} students`} />

      {rows.length === 0 ? (
        <p className="label normal-case tracking-[0.08em] text-ink-faint">
          Nobody has signed in yet.
        </p>
      ) : (
        <div className="-mx-2 overflow-x-auto">
          <table className="w-full min-w-[52rem] border-collapse text-left">
            <thead>
              <tr className="label">
                <Th>Name</Th>
                <Th>Pitch</Th>
                <Th className="text-right">Picked</Th>
                <Th>Selected</Th>
                <Th>Mutual</Th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id} className="hairline align-top">
                  <Td className="whitespace-nowrap">
                    <span className="uppercase tracking-[0.1em]">{row.name}</span>
                    {row.hasPassword ? (
                      <span className="label mt-1 block text-ink-faint">password set</span>
                    ) : null}
                  </Td>
                  <Td className="max-w-[22rem] text-ink-soft">
                    {row.pitch ?? <span className="text-ink-faint">—</span>}
                  </Td>
                  <Td className="text-right tabular-nums">{row.selectedBy.length}</Td>
                  <Td className="max-w-[14rem] text-ink-soft">
                    {row.selected.length > 0 ? row.selected.join(", ") : "—"}
                  </Td>
                  <Td className="max-w-[14rem]">
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
