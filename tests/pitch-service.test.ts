import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { savePitch } from "@/lib/services/pitch-service";
import { getStore } from "@/lib/store";

import { resetStore } from "./helpers/reset";

beforeEach(() => {
  resetStore();
});

afterEach(() => {
  vi.unstubAllEnvs();
});

async function add(name = "Nadia"): Promise<string> {
  const student = await (
    await getStore()
  ).createStudent({
    name,
    nameKey: name.toLowerCase(),
    section: "2pm",
    passwordHash: null,
  });

  return student.id;
}

describe("savePitch", () => {
  it("stores a pitch", async () => {
    const id = await add();
    const updated = await savePitch(id, "A packet-routing sandbox.");

    expect(updated.pitch).toBe("A packet-routing sandbox.");
  });

  it("replaces an earlier pitch", async () => {
    const id = await add();
    await savePitch(id, "First idea.");
    const updated = await savePitch(id, "Second idea.");

    expect(updated.pitch).toBe("Second idea.");
  });

  it("does not disturb the student's section", async () => {
    const id = await add();
    const updated = await savePitch(id, "A type checker.");

    expect(updated.section).toBe("2pm");
  });

  it("refuses for a student who no longer exists", async () => {
    await expect(
      savePitch("3f1c9b62-0000-4000-8000-000000000000", "orphaned"),
    ).rejects.toMatchObject({ code: "not_found" });
  });

  it("refuses once the deadline has passed", async () => {
    const id = await add();
    vi.stubEnv("CLOSES_AT", "2000-01-01T00:00:00Z");

    await expect(savePitch(id, "too late")).rejects.toMatchObject({ code: "locked" });
  });

  it("refuses while the instructor has things closed", async () => {
    const id = await add();
    await (await getStore()).setSetting("locked", "closed");

    await expect(savePitch(id, "too late")).rejects.toMatchObject({ code: "locked" });
  });
});
