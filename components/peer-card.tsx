"use client";

import { cn } from "@/lib/cn";
import { ordinal } from "@/lib/ordinal";
import type { PeerView } from "@/lib/types/section";

/**
 * One rankable classmate. The whole card is the control, so the tap target is
 * large on a phone; the checkbox stays in the DOM for screen readers and
 * keyboard use.
 *
 * `rank` is the student's preference position (1 = first choice) or null when
 * unranked. It is shown as a word, not just a number, so the ordering is
 * impossible to misread as a card index.
 */
export function PeerCard({
  peer,
  rank,
  disabled,
  onToggle,
}: {
  peer: PeerView;
  rank: number | null;
  disabled: boolean;
  onToggle: (id: string) => void;
}) {
  const selected = rank !== null;

  return (
    <label
      className={cn(
        "rounded-card flex cursor-pointer flex-col p-6 transition-colors",
        selected ? "bg-card-alt" : "bg-card hover:bg-card-alt/60",
        disabled && "cursor-default opacity-60",
      )}
    >
      <div className="mb-6 flex items-start justify-between gap-3">
        {selected ? (
          <span className="rounded-pill bg-accent px-3 py-1 text-[0.625rem] uppercase tracking-[0.16em] text-white">
            {ordinal(rank)} choice
          </span>
        ) : (
          <span className="index-mark text-ink-faint">—</span>
        )}

        <input
          type="checkbox"
          className="sr-only"
          checked={selected}
          disabled={disabled}
          onChange={() => onToggle(peer.id)}
        />

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
        {selected ? "Tap to remove" : "Tap to add to your ranking"}
      </span>
    </label>
  );
}
