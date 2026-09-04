import { Card } from "@/components/ui/card";

const STEPS = [
  {
    index: "01",
    title: "Sign in",
    body: "Type your name. Add a password if you want to stop anyone else using it.",
  },
  {
    index: "02",
    title: "Pitch",
    body: "One or two sentences on your project idea. Shared with the whole section.",
  },
  {
    index: "03",
    title: "Choose",
    body: "Read everyone's pitches and pick anyone you'd like to work with. No limit.",
  },
  {
    index: "04",
    title: "Revise",
    body: "Come back and change your answers any time until preferences are locked.",
  },
] as const;

/** Standing instructions, laid out like the numbered panels in a quick-start guide. */
export function IntroCard() {
  return (
    <Card className="flex flex-col">
      <h2 className="label mb-8 text-ink">How this works</h2>

      <ol className="flex flex-1 list-none flex-col gap-7 p-0">
        {STEPS.map((step) => (
          <li key={step.index}>
            <p className="index-mark mb-2">{step.index}</p>
            <h3 className="label text-ink">{step.title}</h3>
            <p className="mt-1 text-xs leading-relaxed tracking-[0.02em] text-ink-soft">
              {step.body}
            </p>
          </li>
        ))}
      </ol>
    </Card>
  );
}
