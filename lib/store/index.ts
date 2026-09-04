import { databaseUrl, isProduction } from "@/lib/config";

import { createMemoryStore } from "./memory-store";
import { createPostgresStore } from "./postgres-store";
import type { Store } from "./types";

/**
 * Resolves the single store instance for this runtime and applies migrations
 * once. Postgres is used whenever DATABASE_URL is present; local development
 * without one falls back to an in-memory store so the app boots immediately.
 */

type StoreHandle = { store: Store; ready: Promise<Store> };

const HANDLE_KEY = "__sectionPitchStore";

function build(): Store {
  const url = databaseUrl();

  if (url) return createPostgresStore(url);

  if (isProduction()) {
    throw new Error(
      "DATABASE_URL is required in production. Add a Postgres database (Vercel Marketplace > Neon) and redeploy.",
    );
  }

  console.warn(
    "[section-pitch] DATABASE_URL is not set - using the in-memory dev store. Data is lost on restart.",
  );
  return createMemoryStore();
}

export async function getStore(): Promise<Store> {
  const globals = globalThis as typeof globalThis & { [HANDLE_KEY]?: StoreHandle };

  if (!globals[HANDLE_KEY]) {
    const store = build();
    globals[HANDLE_KEY] = {
      store,
      ready: store.init().then(() => store),
    };
  }

  return globals[HANDLE_KEY].ready;
}

/** True when persistence is backed by a real database. */
export function isPersistent(): boolean {
  return databaseUrl() !== null;
}

export type { Store } from "./types";
