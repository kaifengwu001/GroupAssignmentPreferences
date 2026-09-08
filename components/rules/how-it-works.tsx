import { Card, CardHeader } from "@/components/ui/card";

const STEPS = [
  {
    index: "02",
    title: "Pick your section",
    body: "2:00 PM or 3:00 PM. Pitching and grouping happen entirely separately — you will only ever see, and only ever be grouped with, people in your own section.",
  },
  {
    index: "03",
    title: "Write a pitch",
    body: "One or two sentences on what you have in mind, up to 300 characters. It is shared with everyone in your section, so write it for them.",
  },
  {
    index: "04",
    title: "Rank your classmates",
    body: "Read the pitches and choose anyone you would like to work with. Pick as many as you like — but the order matters, so put your strongest match first.",
  },
  {
    index: "05",
    title: "Come back and revise",
    body: "Pitches keep arriving, so the list grows. Refresh, reorder, add, and remove as often as you want until the deadline.",
  },
] as const;

/** The standing instructions, laid out as numbered panels. */
export function HowItWorks() {
  return (
    <Card>
      {/* Shares CardHeader with every other panel so the heading treatment and
          spacing stay identical. No index: the four steps below carry 02-05. */}
      <CardHeader title="How it works" />

      <ol className="grid list-none grid-cols-1 gap-8 p-0 sm:grid-cols-2 lg:grid-cols-4">
        {STEPS.map((step) => (
          <li key={step.index}>
            <p className="index-mark mb-3">{step.index}</p>
            <h3 className="label text-ink">{step.title}</h3>
            <p className="mt-2 text-xs leading-relaxed tracking-[0.02em] text-ink-soft">
              {step.body}
            </p>
          </li>
        ))}
      </ol>
    </Card>
  );
}
