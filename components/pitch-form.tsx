"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardHeader } from "@/components/ui/card";
import { Field, Notice, TextArea } from "@/components/ui/field";
import { apiSend } from "@/lib/client/api";
import { PITCH_MAX } from "@/lib/validation/schemas";

export const PITCH_PROMPT =
  "In one or two sentences, what do you have in mind for your project? This will be shared with the section.";

export function PitchForm({ initialPitch }: { initialPitch: string | null }) {
  const router = useRouter();
  const [pitch, setPitch] = useState(initialPitch ?? "");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const remaining = PITCH_MAX - pitch.length;
  const isEditing = initialPitch !== null;

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    setSubmitting(true);

    const result = await apiSend("/api/pitch", "PUT", { pitch });

    if (!result.ok) {
      setError(result.message);
      setSubmitting(false);
      return;
    }

    router.replace("/section");
  }

  return (
    <Card className="max-w-2xl">
      <CardHeader index="02" title="Your pitch" meta={isEditing ? "Editing" : undefined} />

      <form onSubmit={handleSubmit} className="space-y-6">
        <Field
          label="Project idea"
          htmlFor="pitch"
          hint={`${remaining} character${remaining === 1 ? "" : "s"} left`}
        >
          <p className="mb-3 text-sm leading-relaxed tracking-[0.01em] text-ink">
            {PITCH_PROMPT}
          </p>
          <TextArea
            id="pitch"
            name="pitch"
            rows={5}
            value={pitch}
            onChange={(event) => setPitch(event.target.value.slice(0, PITCH_MAX))}
            maxLength={PITCH_MAX}
            required
            placeholder="A tool that…"
          />
        </Field>

        {error ? <Notice tone="error">{error}</Notice> : null}

        <div className="hairline flex flex-wrap items-center gap-3 pt-6">
          <Button type="submit" disabled={submitting || pitch.trim().length < 10}>
            {submitting ? "Saving…" : isEditing ? "Save changes" : "Share with section"}
          </Button>
          {isEditing ? (
            <Button variant="quiet" onClick={() => router.replace("/section")}>
              Cancel
            </Button>
          ) : null}
        </div>
      </form>
    </Card>
  );
}
