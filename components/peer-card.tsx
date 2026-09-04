"use client";

import { cn } from "@/lib/cn";
import type { PeerView } from "@/lib/types/section";

/**
 * One selectable classmate. The whole card is the control, so the tap target
 * is large on a phone; the checkbox itself stays in the DOM for screen readers
 * and keyboard use.
 */
export function PeerCard({
  peer,
  index,
  selected,
  disabled,
  onToggle,
}: {
  peer: PeerView;
  index: number;
  selected: boolean;
  disabled: boolean;
  onToggle: (id: string) => void;
}) {
  const label = String(index + 1).padStart(2, "0");

  return (
    <label
      className={cn(
        "rounded-card flex cursor-pointer flex-col p-6 transition-colors",
        selected ? "bg-card-alt" : "bg-card hover:bg-card-alt/60",
        disabled && "cursor-default opacity-60",
      )}
    >
      <div className="mb-6 flex items-start justify-between gap-3">
        <span className="index-mark">{label}</span>

        <input
          type="checkbox"
          className="sr-only"
          checked={selected}
          disabled={disabled}
          onChange={() => onToggle(peer.id)}
        />

        {/* Selection indicator: the one place colour appears in the grid. */}
        <span
          aria-hidden
          className={cn(
            "mt-0.5 size-3.5 shrink-0 rounded-full border transition-colors",
            selected ? "border-accent bg-accent" : "border-ink-faint bg-transparent",
          )}
        />
      </div>

      <h3 className="text-[0.8125rem] uppercase tracking-[0.14em]">{peer.name}</h3>

      {peer.pitch ? (
        <p className="mt-3 text-sm leading-relaxed tracking-[0.01em] text-ink-soft">
          {peer.pitch}
        </p>
      ) : (
        <p className="label mt-3 text-ink-faint">Awaiting pitch</p>
      )}

      <span className="label mt-6 block text-ink-faint">
        {selected ? "Selected" : "Tap to select"}
      </span>
    </label>
  );
}
