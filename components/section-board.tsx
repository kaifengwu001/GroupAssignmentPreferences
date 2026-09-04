"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";

import { PeerCard } from "@/components/peer-card";
import { SectionSummary } from "@/components/section-summary";
import { Card, CardHeader } from "@/components/ui/card";
import { Notice } from "@/components/ui/field";
import { apiSend } from "@/lib/client/api";
import { useAutosave, type SaveState } from "@/lib/client/use-autosave";
import { useSectionFeed } from "@/lib/client/use-section-feed";
import type { SectionView } from "@/lib/types/section";

const SAVE_LABELS: Record<SaveState, string> = {
  idle: "Choices save automatically",
  pending: "Saving…",
  saving: "Saving…",
  saved: "Saved",
  error: "Not saved",
};

export function SectionBoard({ initial }: { initial: SectionView }) {
  const router = useRouter();
  const { view, offline } = useSectionFeed(initial);

  // Selection is owned locally and seeded once, so a background poll can never
  // overwrite a choice the student is in the middle of making.
  const [selected, setSelected] = useState<ReadonlySet<string>>(
    () => new Set(initial.selectedIds),
  );

  const persist = useCallback(
    (ids: readonly string[]) => apiSend("/api/preferences", "PUT", { targetIds: [...ids] }),
    [],
  );

  const { state, message, schedule } = useAutosave(persist);

  // The instructor may lock the section while this page is open.
  useEffect(() => {
    if (view.locked) router.replace("/locked");
  }, [view.locked, router]);

  const toggle = useCallback(
    (id: string) => {
      setSelected((current) => {
        const next = new Set(current);
        if (next.has(id)) {
          next.delete(id);
        } else {
          next.add(id);
        }
        schedule([...next]);
        return next;
      });
    },
    [schedule],
  );

  const peers = view.peers;
  const selectedCount = useMemo(
    () => peers.filter((peer) => selected.has(peer.id)).length,
    [peers, selected],
  );

  return (
    <>
      <SectionSummary
        name={view.me.name}
        pitch={view.me.pitch}
        selectedCount={selectedCount}
        pitchCount={view.pitchCount}
        totalCount={peers.length + 1}
      />

      <Card>
        <CardHeader
          index="04"
          title="Who would you like to work with?"
          meta="Pick as many as you like — there is no limit"
        >
          <div className="text-right">
            <p className="label" aria-live="polite">
              {state === "error" ? message : SAVE_LABELS[state]}
            </p>
            {offline ? <Notice tone="error">Reconnecting…</Notice> : null}
          </div>
        </CardHeader>

        {peers.length === 0 ? (
          <p className="label normal-case tracking-[0.08em] text-ink-faint">
            You are the first one here. This list fills in as classmates share their
            pitches — it refreshes on its own.
          </p>
        ) : (
          <div
            role="group"
            aria-label="Classmates you would like to work with"
            className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3"
          >
            {peers.map((peer, index) => (
              <PeerCard
                key={peer.id}
                peer={peer}
                index={index}
                selected={selected.has(peer.id)}
                disabled={view.locked}
                onToggle={toggle}
              />
            ))}
          </div>
        )}
      </Card>
    </>
  );
}
