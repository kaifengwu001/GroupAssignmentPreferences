import { cn } from "@/lib/cn";

type Variant = "solid" | "outline" | "danger" | "quiet";

const BASE =
  "inline-flex items-center justify-center gap-2 rounded-pill px-6 py-3 text-[0.6875rem] uppercase tracking-[0.18em] transition-colors disabled:cursor-not-allowed disabled:opacity-40";

const VARIANTS: Record<Variant, string> = {
  solid: "bg-ink text-paper hover:bg-black",
  outline: "border border-line bg-transparent text-ink hover:bg-card-alt",
  danger: "bg-danger text-white hover:brightness-110",
  quiet: "bg-transparent text-ink-soft hover:text-ink",
};

export function Button({
  variant = "solid",
  className,
  type = "button",
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant }) {
  return <button type={type} className={cn(BASE, VARIANTS[variant], className)} {...props} />;
}

export function LinkButton({
  variant = "outline",
  className,
  ...props
}: React.AnchorHTMLAttributes<HTMLAnchorElement> & { variant?: Variant }) {
  return <a className={cn(BASE, VARIANTS[variant], className)} {...props} />;
}
