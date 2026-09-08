"use client";

import { cn } from "@/lib/cn";
import { ordinal } from "@/lib/ordinal";

export type RankedEntry = {
  readonly id: string;
  readonly name: string;
};

/**
 * The student's ranking, top to bottom. This is the authoritative view of
 * order — the cards in the grid show a rank badge, but reordering happens
 * here, where the sequence is visible as a sequence.
 *
 * Reordering uses explicit buttons rather than drag-and-drop so it works with
 * a keyboard, a screen reader, and a thumb on a phone.
 */
export function RankingList({
  entries,
  disabled,
  onMove,
  onRemove,
}: {
  entries: readonly RankedEntry[];
  disabled: boolean;
  onMove: (id: string, direction: -1 | 1) => void;
  onRemove: (id: string) => void;
}) {
  if (entries.length === 0) {
    return (
      <div className="rounded-2xl bg-paper p-6">
        <p className="label text-ink">Your ranking is empty</p>
        <p className="mt-2 text-xs leading-relaxed tracking-[0.02em] text-ink-soft">
          Pick classmates from the list below. The first one you add becomes your first
          choice, and you can reorder them here afterwards.
        </p>
      </div>
    );
  }

  return (
    <ol className="flex list-none flex-col gap-2 p-0">
      {entries.map((entry, index) => {
        const rank = index + 1;
        const isFirst = index === 0;
        const isLast = index === entries.length - 1;

        return (
          <li
            key={entry.id}
            className="flex items-center gap-4 rounded-2xl bg-paper py-3 pl-4 pr-3"
          >
            <span
              className={cn(
                "flex size-8 shrink-0 items-center justify-center rounded-full text-[0.6875rem] tabular-nums",
                isFirst ? "bg-accent text-white" : "bg-card-alt text-ink",
              )}
            >
              {rank}
            </span>

            <span className="flex-1 truncate text-sm tracking-[0.06em]">{entry.name}</span>

            <span className="label hidden shrink-0 text-ink-faint sm:block">
              {ordinal(rank)} choice
            </span>

            <span className="flex shrink-0 items-center gap-1">
              <IconButton
                label={`Move ${entry.name} up to ${ordinal(rank - 1)} choice`}
                disabled={disabled || isFirst}
                onClick={() => onMove(entry.id, -1)}
              >
                ↑
              </IconButton>
              <IconButton
                label={`Move ${entry.name} down to ${ordinal(rank + 1)} choice`}
                disabled={disabled || isLast}
                onClick={() => onMove(entry.id, 1)}
              >
                ↓
              </IconButton>
              <IconButton
                label={`Remove ${entry.name} from your ranking`}
                disabled={disabled}
                onClick={() => onRemove(entry.id)}
              >
                ✕
              </IconButton>
            </span>
          </li>
        );
      })}
    </ol>
  );
}

function IconButton({
  label,
  disabled,
  onClick,
  children,
}: {
  label: string;
  disabled: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      disabled={disabled}
      onClick={onClick}
      className="flex size-8 items-center justify-center rounded-full text-ink-soft transition-colors hover:bg-card-alt hover:text-ink disabled:cursor-not-allowed disabled:opacity-25 disabled:hover:bg-transparent"
    >
      <span aria-hidden>{children}</span>
    </button>
  );
}
