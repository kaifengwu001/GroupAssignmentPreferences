"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";

import { PeerCard } from "@/components/peer-card";
import { RankingList, type RankedEntry } from "@/components/ranking-list";
import { SectionSummary } from "@/components/section-summary";
import { Card, CardHeader } from "@/components/ui/card";
import { Notice } from "@/components/ui/field";
import { apiSend } from "@/lib/client/api";
import { useAutosave, type SaveState } from "@/lib/client/use-autosave";
import { useSectionFeed } from "@/lib/client/use-section-feed";
import { sectionLabel } from "@/lib/sections";
import type { SectionView } from "@/lib/types/section";

const SAVE_LABELS: Record<SaveState, string> = {
  idle: "Ranking saves automatically",
  pending: "Saving…",
  saving: "Saving…",
  saved: "Saved",
  error: "Not saved",
};

/** Moves an item one position, returning a new array. */
function reorder(ids: readonly string[], id: string, direction: -1 | 1): readonly string[] {
  const from = ids.indexOf(id);
  const to = from + direction;
  if (from === -1 || to < 0 || to >= ids.length) return ids;

  const next = [...ids];
  [next[from], next[to]] = [next[to], next[from]];
  return next;
}

export function SectionBoard({
  initial,
  closesLabel,
  remaining,
}: {
  initial: SectionView;
  closesLabel: string | null;
  remaining: string | null;
}) {
  const router = useRouter();
  const { view, offline } = useSectionFeed(initial);

  // Ranking is owned locally and seeded once, so a background poll can never
  // reorder or clobber a choice the student is in the middle of making.
  const [ranking, setRanking] = useState<readonly string[]>(initial.orderedSelectedIds);

  const persist = useCallback(
    (ids: readonly string[]) =>
      apiSend("/api/preferences", "PUT", { orderedTargetIds: [...ids] }),
    [],
  );

  const { state, message, schedule } = useAutosave(persist);

  // The instructor may lock the section, or the deadline may pass, while this
  // page is open.
  useEffect(() => {
    if (view.locked) router.replace("/locked");
  }, [view.locked, router]);

  const update = useCallback(
    (next: readonly string[]) => {
      setRanking(next);
      schedule(next);
    },
    [schedule],
  );

  const toggle = useCallback(
    (id: string) =>
      update(ranking.includes(id) ? ranking.filter((item) => item !== id) : [...ranking, id]),
    [ranking, update],
  );

  const move = useCallback(
    (id: string, direction: -1 | 1) => update(reorder(ranking, id, direction)),
    [ranking, update],
  );

  const remove = useCallback(
    (id: string) => update(ranking.filter((item) => item !== id)),
    [ranking, update],
  );

  const peers = view.peers;

  // Rank lookup drives the badges; the ranking array itself stays the source
  // of truth for order.
  const rankById = useMemo(
    () => new Map(ranking.map((id, index) => [id, index + 1])),
    [ranking],
  );

  const entries = useMemo(
    (): readonly RankedEntry[] =>
      ranking
        .map((id) => peers.find((peer) => peer.id === id))
        .filter((peer): peer is (typeof peers)[number] => peer !== undefined)
        .map((peer) => ({ id: peer.id, name: peer.name })),
    [ranking, peers],
  );

  return (
    <>
      <SectionSummary
        name={view.me.name}
        sectionName={sectionLabel(view.me.section)}
        pitch={view.me.pitch}
        rankedCount={entries.length}
        topChoice={entries[0]?.name ?? null}
        pitchCount={view.pitchCount}
        totalCount={view.expectedStudents}
        closesLabel={closesLabel}
        remaining={remaining}
      />

      <Card>
        <CardHeader
          index="04"
          title="Rank who you want to work with"
          meta={[
            "Order matters — no limit on how many",
            "Pitches arrive live as classmates submit them. Come back as often as you like — add, remove, and reorder freely until the deadline.",
          ]}
          metaCase="sentence"
        >
          <div className="text-right">
            <p className="label" aria-live="polite">
              {state === "error" ? message : SAVE_LABELS[state]}
            </p>
            {offline ? <Notice tone="error">Reconnecting…</Notice> : null}
          </div>
        </CardHeader>

        <div className="mb-8">
          <h3 className="label mb-3 text-ink">
            Your ranking {entries.length > 0 ? `— ${entries.length} chosen` : ""}
          </h3>
          <RankingList
            entries={entries}
            disabled={view.locked}
            onMove={move}
            onRemove={remove}
          />
        </div>

        <div className="hairline pt-8">
          <h3 className="label mb-4 text-ink">
            Everyone in the {sectionLabel(view.me.section)} section
          </h3>

          {peers.length === 0 ? (
            <p className="label normal-case tracking-[0.08em] text-ink-faint">
              You are the first one here. This fills in as classmates in your section share
              their pitches — it refreshes on its own, so just leave the page open.
            </p>
          ) : (
            <div
              role="group"
              aria-label="Classmates you can rank"
              className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3"
            >
              {peers.map((peer) => (
                <PeerCard
                  key={peer.id}
                  peer={peer}
                  rank={rankById.get(peer.id) ?? null}
                  disabled={view.locked}
                  onToggle={toggle}
                />
              ))}
            </div>
          )}
        </div>
      </Card>
    </>
  );
}
