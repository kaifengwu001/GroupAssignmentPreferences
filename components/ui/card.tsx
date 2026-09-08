import { cn } from "@/lib/cn";

/** The rounded light panel that every screen is built from. */
export function Card({
  children,
  className,
  as: Tag = "section",
}: {
  children: React.ReactNode;
  className?: string;
  as?: "section" | "div" | "article" | "form" | "li";
}) {
  return (
    <Tag className={cn("rounded-card bg-card p-6 sm:p-8", className)}>{children}</Tag>
  );
}

/**
 * Numbered card heading, mirroring the 01 / 02 / 03 steps in the reference.
 * `index` is optional so the same header works for unnumbered panels.
 */
export function CardHeader({
  index,
  title,
  meta,
  metaCase = "upper",
  children,
}: {
  index?: string;
  title: string;
  /** A single caption, or several rendered one per line. */
  meta?: string | readonly string[];
  /** Sentence case for captions long enough that all-caps hurts to read. */
  metaCase?: "upper" | "sentence";
  children?: React.ReactNode;
}) {
  const metaLines = meta === undefined ? [] : Array.isArray(meta) ? meta : [meta as string];

  return (
    <header className="mb-8 flex items-start justify-between gap-4">
      <div className="max-w-2xl">
        {index ? <p className="index-mark mb-6">{index}</p> : null}
        <h2 className="label text-ink">{title}</h2>
        {metaLines.map((line) => (
          <p
            key={line}
            className={cn(
              "label mt-1 text-ink-faint",
              metaCase === "sentence" && "normal-case tracking-[0.08em]",
            )}
          >
            {line}
          </p>
        ))}
      </div>
      {children ? <div className="shrink-0">{children}</div> : null}
    </header>
  );
}

/** The lone red dot: used at most once per screen. */
export function AccentDot({ className }: { className?: string }) {
  return (
    <span
      aria-hidden
      className={cn("block size-3 rounded-full bg-accent", className)}
    />
  );
}
