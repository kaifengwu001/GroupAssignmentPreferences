import { Card, CardHeader } from "@/components/ui/card";
import { SECTIONS } from "@/lib/sections";

const RULES = [
  "Your pitch is public to your section. Your rankings are not — nobody sees who you picked except the instructor.",
  "Ranking someone is not a request you need their agreement for, and they are never told.",
  "There is no minimum and no maximum. Ranking more people gives you a better chance of landing a match.",
  "Groups are formed from everyone's rankings together, so a first choice is a strong signal but not a guarantee.",
  "Sign in with the same name each time.",
] as const;

/** The rules proper, plus the section timetable. */
export function FinePrint() {
  return (
    <div className="grid gap-2 lg:grid-cols-3">
      <Card className="lg:col-span-2">
        <CardHeader index="06" title="The rules" />

        <ul className="flex list-none flex-col gap-4 p-0">
          {RULES.map((rule) => (
            <li key={rule} className="flex gap-4">
              <span aria-hidden className="mt-2 size-1.5 shrink-0 rounded-full bg-ink-faint" />
              <span className="text-sm leading-relaxed tracking-[0.01em] text-ink-soft">
                {rule}
              </span>
            </li>
          ))}
        </ul>
      </Card>

      <Card>
        <CardHeader index="07" title="Sections" />

        <ul className="flex list-none flex-col gap-2 p-0">
          {SECTIONS.map((section) => (
            <li key={section.id} className="rounded-2xl bg-paper p-5">
              <p className="text-base tracking-[0.12em]">{section.label}</p>
              <p className="label mt-1 text-ink-faint">{section.blurb}</p>
            </li>
          ))}
        </ul>

        <p className="label mt-6 normal-case tracking-[0.08em] text-ink-faint">
          Pick the wrong one and sign-in will tell you which section you are on, so
          nothing is lost.
        </p>
      </Card>
    </div>
  );
}
