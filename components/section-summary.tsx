"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";

import { Button, LinkButton } from "@/components/ui/button";
import { Card, CardHeader } from "@/components/ui/card";
import { apiSend } from "@/lib/client/api";

/** The student's own pitch and standing, with the way to change either. */
export function SectionSummary({
  name,
  sectionName,
  pitch,
  rankedCount,
  topChoice,
  pitchCount,
  totalCount,
  closesLabel,
  remaining,
}: {
  name: string;
  sectionName: string;
  pitch: string | null;
  rankedCount: number;
  topChoice: string | null;
  pitchCount: number;
  totalCount: number;
  closesLabel: string | null;
  remaining: string | null;
}) {
  const router = useRouter();

  async function signOut() {
    await apiSend("/api/auth/logout", "POST");
    router.replace("/");
  }

  return (
    <Card className="mb-2">
      <CardHeader index="03" title={`${name} · ${sectionName} section`}>
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

      <dl className="hairline mt-8 grid grid-cols-2 gap-4 pt-6 sm:grid-cols-4">
        <Stat label="You picked" value={rankedCount} />
        <Stat label="Your first choice" value={topChoice ?? "—"} />
        <Stat label="Pitches in" value={`${pitchCount} / ${totalCount}`} />
        <Stat label="Closes" value={remaining ?? "—"} />
      </dl>

      <p className="label mt-6 normal-case tracking-[0.08em] text-ink-faint">
        Nobody can see who you ranked — only your instructor.
        {closesLabel ? ` Everything closes ${closesLabel}.` : ""}{" "}
        <Link href="/" className="underline decoration-line underline-offset-4">
          Rules
        </Link>
      </p>
    </Card>
  );
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div>
      <dt className="label">{label}</dt>
      <dd className="mt-1 truncate text-[0.8125rem] tracking-[0.14em] tabular-nums">
        {value}
      </dd>
    </div>
  );
}
