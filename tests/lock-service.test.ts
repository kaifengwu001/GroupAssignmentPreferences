import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  assertUnlocked,
  getLockState,
  isLocked,
  setLocked,
} from "@/lib/services/lock-service";
import { getStore } from "@/lib/store";

import { resetStore } from "./helpers/reset";

const PAST = "2000-01-01T00:00:00Z";
const FUTURE = "2099-01-01T00:00:00Z";

beforeEach(() => {
  resetStore();
});

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("the deadline on its own", () => {
  it("is open before it passes", async () => {
    vi.stubEnv("CLOSES_AT", FUTURE);

    const state = await getLockState();
    expect(state.locked).toBe(false);
    expect(state.reason).toBeNull();
  });

  it("closes by itself once it passes", async () => {
    vi.stubEnv("CLOSES_AT", PAST);

    const state = await getLockState();
    expect(state.locked).toBe(true);
    expect(state.reason).toBe("deadline");
  });

  it("stays open when the deadline is unparseable", async () => {
    vi.stubEnv("CLOSES_AT", "whenever");
    vi.spyOn(console, "error").mockImplementation(() => {});

    // Better to keep collecting than to lock everyone out over a typo.
    expect(await isLocked()).toBe(false);
  });
});

describe("the instructor override", () => {
  it("can close before the deadline", async () => {
    vi.stubEnv("CLOSES_AT", FUTURE);
    await setLocked(true);

    const state = await getLockState();
    expect(state.locked).toBe(true);
    expect(state.reason).toBe("instructor");
  });

  it("can reopen after the deadline has passed", async () => {
    vi.stubEnv("CLOSES_AT", PAST);
    await setLocked(false);

    const state = await getLockState();
    expect(state.locked).toBe(false);
    expect(state.override).toBe("open");
  });

  it("survives a round trip through the store", async () => {
    await setLocked(true);
    expect(await (await getStore()).getSetting("locked")).toBe("closed");

    await setLocked(false);
    expect(await (await getStore()).getSetting("locked")).toBe("open");
  });

  it("is ignored when the stored value is not recognised", async () => {
    vi.stubEnv("CLOSES_AT", FUTURE);
    await (await getStore()).setSetting("locked", "maybe");

    const state = await getLockState();
    expect(state.override).toBeNull();
    expect(state.locked).toBe(false);
  });
});

describe("assertUnlocked", () => {
  it("passes while open", async () => {
    vi.stubEnv("CLOSES_AT", FUTURE);
    await expect(assertUnlocked()).resolves.toBeUndefined();
  });

  it("throws the shared locked error when closed", async () => {
    vi.stubEnv("CLOSES_AT", PAST);
    await expect(assertUnlocked()).rejects.toMatchObject({ code: "locked", status: 423 });
  });
});
