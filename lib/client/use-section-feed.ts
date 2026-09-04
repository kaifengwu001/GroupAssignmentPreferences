"use client";

import { useCallback, useEffect, useState } from "react";

import type { SectionView } from "@/lib/types/section";

import { apiGet } from "./api";

const POLL_INTERVAL_MS = 6_000;

/**
 * Keeps the section roster and pitches current by polling. Polling (rather
 * than a socket) keeps this deployable to serverless with no extra service.
 *
 * The caller owns its own selection state; this hook never returns anyone
 * else's choices, and the consumer intentionally ignores the incoming
 * `selectedIds` after first load so a poll cannot clobber an in-progress edit.
 */
export function useSectionFeed(initial: SectionView) {
  const [view, setView] = useState<SectionView>(initial);
  const [staleSince, setStaleSince] = useState<number | null>(null);

  const refresh = useCallback(async (): Promise<SectionView | null> => {
    const result = await apiGet<SectionView>("/api/section");

    if (!result.ok) {
      setStaleSince((current) => current ?? Date.now());
      return null;
    }

    setView(result.data);
    setStaleSince(null);
    return result.data;
  }, []);

  useEffect(() => {
    let active = true;

    const tick = () => {
      // Don't poll a backgrounded tab; it resumes on focus.
      if (document.visibilityState !== "visible" || !active) return;
      void refresh();
    };

    const interval = setInterval(tick, POLL_INTERVAL_MS);
    document.addEventListener("visibilitychange", tick);

    return () => {
      active = false;
      clearInterval(interval);
      document.removeEventListener("visibilitychange", tick);
    };
  }, [refresh]);

  return { view, refresh, offline: staleSince !== null } as const;
}
