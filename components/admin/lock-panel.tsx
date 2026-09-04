"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { AccentDot, Card, CardHeader } from "@/components/ui/card";
import { Notice } from "@/components/ui/field";
import { apiSend } from "@/lib/client/api";

/**
 * The cut-off switch. Locking is reversible from here, but it is deliberately
 * behind a confirmation step since it signs every student out mid-session.
 */
export function LockPanel({ locked }: { locked: boolean }) {
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

  return (
    <Card>
      <CardHeader index="01" title={locked ? "Locked" : "Open for responses"}>
        {locked ? <AccentDot /> : null}
      </CardHeader>

      <p className="text-sm leading-relaxed tracking-[0.01em] text-ink-soft">
        {locked
          ? "Students cannot sign in or change anything. Everyone sees “preferences have been locked in”."
          : "Students can sign in, pitch, and revise their selections."}
      </p>

      <div className="hairline mt-8 flex flex-wrap items-center gap-3 pt-6">
        {locked ? (
          <Button variant="outline" onClick={() => setLocked(false)} disabled={submitting}>
            {submitting ? "Reopening…" : "Reopen responses"}
          </Button>
        ) : confirming ? (
          <>
            <Button variant="accent" onClick={() => setLocked(true)} disabled={submitting}>
              {submitting ? "Locking…" : "Yes, lock it in"}
            </Button>
            <Button variant="quiet" onClick={() => setConfirming(false)}>
              Cancel
            </Button>
          </>
        ) : (
          <Button variant="outline" onClick={() => setConfirming(true)}>
            Lock preferences
          </Button>
        )}
      </div>

      {confirming && !locked ? (
        <p className="label mt-4 normal-case tracking-[0.08em]">
          This signs everyone out immediately. You can reopen it afterwards.
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
