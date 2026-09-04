"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import type { ApiResult } from "./api";

export type SaveState = "idle" | "pending" | "saving" | "saved" | "error";

/**
 * Debounced write-behind saving. Rapid changes collapse into one request, and
 * a stale response can never overwrite the status of a newer one.
 */
export function useAutosave<T>(
  save: (value: T) => Promise<ApiResult<unknown>>,
  delayMs = 600,
) {
  const [state, setState] = useState<SaveState>("idle");
  const [message, setMessage] = useState<string | null>(null);

  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pending = useRef<{ value: T } | null>(null);
  const sequence = useRef(0);
  const saveRef = useRef(save);

  useEffect(() => {
    saveRef.current = save;
  }, [save]);

  const flush = useCallback(async () => {
    const queued = pending.current;
    if (!queued) return;

    if (timer.current) {
      clearTimeout(timer.current);
      timer.current = null;
    }

    const ticket = ++sequence.current;
    setState("saving");

    const result = await saveRef.current(queued.value);

    // A newer save started while this one was in flight; let it own the status.
    if (ticket !== sequence.current) return;

    if (result.ok) {
      setState("saved");
      setMessage(null);
    } else {
      setState("error");
      setMessage(result.message);
    }
  }, []);

  const schedule = useCallback(
    (value: T) => {
      pending.current = { value };
      setState("pending");
      setMessage(null);

      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(() => void flush(), delayMs);
    },
    [delayMs, flush],
  );

  // Try to land a queued change if the page is being backgrounded or closed.
  useEffect(() => {
    const onHide = () => {
      if (pending.current) void flush();
    };

    window.addEventListener("pagehide", onHide);
    document.addEventListener("visibilitychange", onHide);

    return () => {
      window.removeEventListener("pagehide", onHide);
      document.removeEventListener("visibilitychange", onHide);
      if (timer.current) clearTimeout(timer.current);
    };
  }, [flush]);

  return { state, message, schedule, flush } as const;
}
