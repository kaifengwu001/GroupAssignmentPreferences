import { AccentDot } from "./card";

/** Shared page frame: fixed masthead, centred column, generous whitespace. */
export function PageShell({
  title,
  subtitle,
  action,
  accent = false,
  children,
}: {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
  accent?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-5xl flex-col px-4 py-8 sm:px-6 sm:py-12">
      <header className="mb-4 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-[0.6875rem] uppercase tracking-[0.32em]">{title}</h1>
          {subtitle ? <p className="label mt-2 text-ink-faint">{subtitle}</p> : null}
        </div>
        <div className="flex items-center gap-4">
          {action}
          {accent ? <AccentDot /> : null}
        </div>
      </header>

      <main className="flex flex-1 flex-col gap-2">{children}</main>

      <footer className="label mt-10 text-ink-faint">
        Section pitch &middot; responses are visible to your section
      </footer>
    </div>
  );
}
