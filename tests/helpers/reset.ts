/**
 * The store and its in-memory state are cached on globalThis so that Next.js
 * hot reloads keep data. Tests need the opposite, so each one starts by
 * dropping both handles.
 */

const CACHE_KEYS = [
  "__sectionPitchStore",
  "__sectionPitchMemoryState",
  "__sectionPitchRateBuckets",
] as const;

export function resetStore(): void {
  const globals = globalThis as Record<string, unknown>;
  for (const key of CACHE_KEYS) delete globals[key];
}
