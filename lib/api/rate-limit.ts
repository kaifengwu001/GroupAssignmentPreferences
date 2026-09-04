import { AppError } from "@/lib/errors";

/**
 * Fixed-window limiter for the sign-in routes, sized for a single section.
 *
 * State is per-instance and in memory, so on serverless this throttles a
 * determined attacker rather than stopping one outright. That is the intended
 * trade-off here: it blunts password guessing without adding a Redis
 * dependency. Move to a shared store if this ever guards something sensitive.
 */

type Window = { count: number; resetAt: number };

const BUCKETS_KEY = "__sectionPitchRateBuckets";

function buckets(): Map<string, Window> {
  const globals = globalThis as typeof globalThis & { [BUCKETS_KEY]?: Map<string, Window> };
  if (!globals[BUCKETS_KEY]) globals[BUCKETS_KEY] = new Map();
  return globals[BUCKETS_KEY];
}

/** Best-effort client identity from proxy headers. */
export function clientKey(request: Request, scope: string): string {
  const forwarded = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  const real = request.headers.get("x-real-ip")?.trim();
  return `${scope}:${forwarded || real || "unknown"}`;
}

export function enforceRateLimit(
  key: string,
  limit: number,
  windowMs: number,
): void {
  const now = Date.now();
  const store = buckets();
  const current = store.get(key);

  if (!current || current.resetAt <= now) {
    store.set(key, { count: 1, resetAt: now + windowMs });
    return;
  }

  if (current.count >= limit) {
    const seconds = Math.max(1, Math.ceil((current.resetAt - now) / 1000));
    throw new AppError(
      "validation_failed",
      429,
      `Too many attempts. Try again in ${seconds} second${seconds === 1 ? "" : "s"}.`,
    );
  }

  // Replace rather than mutate the stored window.
  store.set(key, { count: current.count + 1, resetAt: current.resetAt });
}
