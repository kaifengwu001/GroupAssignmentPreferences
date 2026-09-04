import { LinkButton } from "@/components/ui/button";
import { Card, CardHeader } from "@/components/ui/card";

const EXPORTS = [
  {
    format: "students",
    label: "Students",
    body: "One row per student: pitch, who they picked, who picked them, mutual matches.",
  },
  {
    format: "pairs",
    label: "Pairs",
    body: "One row per choice. Best for pivot tables or feeding a grouping script.",
  },
  {
    format: "matrix",
    label: "Matrix",
    body: "Grid of every student against every other. Quickest to eyeball for clusters.",
  },
] as const;

export function ExportPanel({ persistent }: { persistent: boolean }) {
  return (
    <Card>
      <CardHeader index="03" title="Download responses" meta="CSV, UTF-8" />

      <div className="grid gap-2 sm:grid-cols-3">
        {EXPORTS.map((item) => (
          <div key={item.format} className="rounded-2xl bg-paper p-5">
            <h3 className="label text-ink">{item.label}</h3>
            <p className="mt-2 mb-5 text-xs leading-relaxed tracking-[0.02em] text-ink-soft">
              {item.body}
            </p>
            <LinkButton
              href={`/api/admin/export?format=${item.format}`}
              download
              className="w-full"
            >
              Download
            </LinkButton>
          </div>
        ))}
      </div>

      {persistent ? null : (
        <p className="label mt-6 normal-case tracking-[0.08em] text-accent">
          No database is connected, so responses live in memory and vanish on restart.
          Set DATABASE_URL before using this with real students.
        </p>
      )}
    </Card>
  );
}
