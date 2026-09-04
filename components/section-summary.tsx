"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";

import { Button, LinkButton } from "@/components/ui/button";
import { Card, CardHeader } from "@/components/ui/card";
import { apiSend } from "@/lib/client/api";

/** The student's own pitch, with the affordance to change it or sign out. */
export function SectionSummary({
  name,
  pitch,
  selectedCount,
  pitchCount,
  totalCount,
}: {
  name: string;
  pitch: string | null;
  selectedCount: number;
  pitchCount: number;
  totalCount: number;
}) {
  const router = useRouter();

  async function signOut() {
    await apiSend("/api/auth/logout", "POST");
    router.replace("/");
  }

  return (
    <Card className="mb-2">
      <CardHeader index="03" title={`Signed in as ${name}`}>
        <Button variant="quiet" onClick={signOut}>
          Sign out
        </Button>
      </CardHeader>

      <div className="grid gap-8 sm:grid-cols-[1fr_auto] sm:items-end">
        <div>
          <p className="label mb-2">Your pitch</p>
          <p className="text-sm leading-relaxed tracking-[0.01em] text-ink">
            {pitch ?? "Not shared yet"}
          </p>
        </div>

        <LinkButton href="/pitch" variant="outline" className="justify-self-start">
          Edit pitch
        </LinkButton>
      </div>

      <dl className="hairline mt-8 grid grid-cols-3 gap-4 pt-6">
        <Stat label="You selected" value={selectedCount} />
        <Stat label="Pitches in" value={`${pitchCount} / ${totalCount}`} />
        <Stat label="Choices are" value="Private" />
      </dl>

      <p className="label mt-6 normal-case tracking-[0.08em] text-ink-faint">
        Nobody can see who you picked — only your instructor. Come back and change your
        selections any time before they are locked.{" "}
        <Link href="/pitch" className="underline decoration-line underline-offset-4">
          Update your pitch
        </Link>
        .
      </p>
    </Card>
  );
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div>
      <dt className="label">{label}</dt>
      <dd className="mt-1 text-[0.8125rem] tracking-[0.14em] tabular-nums">{value}</dd>
    </div>
  );
}
