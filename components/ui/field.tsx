import { cn } from "@/lib/cn";

const CONTROL =
  "w-full rounded-2xl border border-line bg-paper px-4 py-3 text-sm tracking-[0.02em] text-ink placeholder:text-ink-faint focus:border-ink focus:outline-none";

export function Field({
  label,
  hint,
  htmlFor,
  children,
}: {
  label: string;
  hint?: string;
  htmlFor: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-2">
      <label className="label block" htmlFor={htmlFor}>
        {label}
      </label>
      {children}
      {hint ? <p className="label text-ink-faint normal-case tracking-[0.08em]">{hint}</p> : null}
    </div>
  );
}

export function TextInput({
  className,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input className={cn(CONTROL, className)} {...props} />;
}

export function TextArea({
  className,
  ...props
}: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea className={cn(CONTROL, "resize-none leading-relaxed", className)} {...props} />;
}

/** Inline status line. Only errors take colour; everything else stays monochrome. */
export function Notice({
  tone,
  children,
}: {
  tone: "error" | "info" | "success";
  children: React.ReactNode;
}) {
  const toneClass =
    tone === "error" ? "text-danger" : tone === "success" ? "text-accent" : "text-ink-soft";

  return (
    <p
      role={tone === "error" ? "alert" : "status"}
      className={cn("label normal-case tracking-[0.08em]", toneClass)}
    >
      {children}
    </p>
  );
}
