"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { AccentDot, Card, CardHeader } from "@/components/ui/card";
import { Notice } from "@/components/ui/field";
import { apiSend } from "@/lib/client/api";

/**
 * The cut-off switch. The published deadline closes things on its own; this
 * panel closes early or reopens afterwards, and the override outlives the
 * deadline in both directions.
 */
export function LockPanel({
  locked,
  reason,
  closesAtLabel,
}: {
  locked: boolean;
  reason: "deadline" | "instructor" | null;
  closesAtLabel: string | null;
}) {
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function setLocked(next: boolean) {
    setError(null);
    setSubmitting(true);

    const result = await apiSend("/api/admin/lock", "PUT", { locked: next });
    setSubmitting(false);

    if (!result.ok) {
      setError(result.message);
      return;
    }

    setConfirming(false);
    router.refresh();
  }

  const status = locked
    ? reason === "deadline"
      ? "Closed — the deadline passed"
      : "Closed — you locked it"
    : "Open for responses";

  return (
    <Card>
      <CardHeader index="01" title={status} meta={closesAtLabel ?? undefined}>
        {locked ? <AccentDot /> : null}
      </CardHeader>

      <p className="text-sm leading-relaxed tracking-[0.01em] text-ink-soft">
        {locked
          ? "Students cannot sign in or change anything. Everyone sees “preferences have been locked in”."
          : `Students can sign in, pitch, and revise their ranking${
              closesAtLabel ? `. This closes on its own at ${closesAtLabel}` : ""
            }.`}
      </p>

      <div className="hairline mt-8 flex flex-wrap items-center gap-3 pt-6">
        {locked ? (
          <Button variant="outline" onClick={() => setLocked(false)} disabled={submitting}>
            {submitting ? "Reopening…" : "Reopen responses"}
          </Button>
        ) : confirming ? (
          <>
            <Button variant="danger" onClick={() => setLocked(true)} disabled={submitting}>
              {submitting ? "Locking…" : "Yes, lock it in"}
            </Button>
            <Button variant="quiet" onClick={() => setConfirming(false)}>
              Cancel
            </Button>
          </>
        ) : (
          <Button variant="outline" onClick={() => setConfirming(true)}>
            Lock early
          </Button>
        )}
      </div>

      {confirming && !locked ? (
        <p className="label mt-4 normal-case tracking-[0.08em]">
          This closes both sections immediately and signs everyone out. You can reopen it
          afterwards.
        </p>
      ) : null}

      {locked && reason === "deadline" ? (
        <p className="label mt-4 normal-case tracking-[0.08em] text-ink-faint">
          Reopening overrides the deadline until you lock it again.
        </p>
      ) : null}

      {error ? (
        <div className="mt-4">
          <Notice tone="error">{error}</Notice>
        </div>
      ) : null}
    </Card>
  );
}
