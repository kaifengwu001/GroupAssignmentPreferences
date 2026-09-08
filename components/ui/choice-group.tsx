"use client";

import { cn } from "@/lib/cn";

export type Choice<T extends string> = {
  readonly value: T;
  readonly label: string;
  readonly hint?: string;
};

/** Radio group rendered as side-by-side cards, for short mutually exclusive sets. */
export function ChoiceGroup<T extends string>({
  legend,
  name,
  value,
  options,
  onChange,
}: {
  legend: string;
  name: string;
  value: T | null;
  options: readonly Choice<T>[];
  onChange: (value: T) => void;
}) {
  return (
    <fieldset>
      <legend className="label mb-2">{legend}</legend>

      <div className="grid grid-cols-2 gap-2">
        {options.map((option) => {
          const selected = option.value === value;

          return (
            <label
              key={option.value}
              className={cn(
                "flex cursor-pointer items-start gap-3 rounded-2xl border p-4 transition-colors",
                selected
                  ? "border-ink bg-card-alt"
                  : "border-line bg-paper hover:bg-card-alt/60",
              )}
            >
              <input
                type="radio"
                name={name}
                value={option.value}
                checked={selected}
                onChange={() => onChange(option.value)}
                className="sr-only"
              />

              <span
                aria-hidden
                className={cn(
                  "mt-1 size-3.5 shrink-0 rounded-full border transition-colors",
                  selected ? "border-accent bg-accent" : "border-ink-faint",
                )}
              />

              <span>
                <span className="block text-sm tracking-[0.1em]">{option.label}</span>
                {option.hint ? (
                  <span className="label mt-1 block text-ink-faint">{option.hint}</span>
                ) : null}
              </span>
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}
