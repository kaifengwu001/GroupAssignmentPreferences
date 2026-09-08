import { LinkButton } from "@/components/ui/button";
import { AccentDot, Card } from "@/components/ui/card";

/** Masthead panel: what this is, and the way in. */
export function HeroCard({
  signedIn,
  continueHref,
}: {
  signedIn: boolean;
  continueHref: string;
}) {
  return (
    // h-full lets the card fill the grid row, so it stays level with the key
    // dates panel beside it; justify-between then spreads the content to suit.
    <Card className="flex h-full min-h-[20rem] flex-col justify-between gap-12">
      <div className="flex items-start justify-between">
        <p className="index-mark">00</p>
        <AccentDot />
      </div>

      <div>
        <h2 className="text-lg uppercase leading-tight tracking-[0.14em] sm:text-2xl">
          Pitch your project.
          <br />
          Rank who you want
          <br />
          to build it with.
        </h2>

        <p className="mt-8 max-w-md text-sm leading-relaxed tracking-[0.01em] text-ink-soft">
          Read the rules below, then sign in. It takes about three minutes, and you can
          change everything right up to the deadline.
        </p>
      </div>

      <div>
        <LinkButton href={continueHref} variant="solid">
          {signedIn ? "Back to your section" : "Get started"}
        </LinkButton>
      </div>
    </Card>
  );
}
