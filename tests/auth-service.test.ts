import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { AppError } from "@/lib/errors";
import { signIn } from "@/lib/services/auth-service";
import { getStore } from "@/lib/store";

import { resetStore } from "./helpers/reset";
import { asRosterValue, FAKE_2PM, FAKE_3PM } from "./helpers/students";

beforeEach(() => {
  resetStore();
});

afterEach(() => {
  vi.unstubAllEnvs();
});

function withRosters(): void {
  vi.stubEnv("SECTION_ROSTER_2PM", asRosterValue(FAKE_2PM));
  vi.stubEnv("SECTION_ROSTER_3PM", asRosterValue(FAKE_3PM));
}

/** Asserts the thrown AppError code, which is what the UI switches on. */
async function codeOf(run: () => Promise<unknown>): Promise<string> {
  try {
    await run();
  } catch (error) {
    if (error instanceof AppError) return error.code;
    throw error;
  }
  throw new Error("expected the call to throw");
}

describe("signIn without a roster", () => {
  it("lets any name in and stores it in natural order", async () => {
    const student = await signIn({ name: "Ashwood, Nadia", section: "2pm", password: "" });

    expect(student.name).toBe("Nadia Ashwood");
    expect(student.section).toBe("2pm");
  });

  it("returns the same student for a differently ordered name", async () => {
    const first = await signIn({ name: "Ashwood, Nadia", section: "2pm", password: "" });
    const second = await signIn({ name: "nadia ashwood", section: "2pm", password: "" });

    expect(second.id).toBe(first.id);
  });

  it("rejects a name with nothing matchable in it", async () => {
    expect(await codeOf(() => signIn({ name: "!!!", section: "2pm", password: "" }))).toBe(
      "not_on_roster",
    );
  });
});

describe("signIn with per-section rosters", () => {
  beforeEach(withRosters);

  it("accepts a rostered name in its own section", async () => {
    const student = await signIn({ name: "Nadia Ashwood", section: "2pm", password: "" });
    expect(student.section).toBe("2pm");
  });

  it("uses the roster's spelling rather than what was typed", async () => {
    const student = await signIn({ name: "lucia ferran", section: "2pm", password: "" });

    // Accents come from the roster, so the shared list stays correct even
    // though the student typed the unaccented form.
    expect(student.name).toBe("Lucía Ferrán");
  });

  it("matches a roster entry regardless of name order", async () => {
    const student = await signIn({
      name: "Marcus Okonjo Blake",
      section: "2pm",
      password: "",
    });

    expect(student.name).toBe("Marcus Okonjo Blake");
  });

  it("turns away a name on nobody's roster", async () => {
    expect(
      await codeOf(() => signIn({ name: "Mallory Random", section: "2pm", password: "" })),
    ).toBe("not_on_roster");
  });

  it("names the correct section when a student picks the wrong one", async () => {
    const code = await codeOf(() =>
      signIn({ name: "Nadia Ashwood", section: "3pm", password: "" }),
    );

    expect(code).toBe("wrong_section");
  });

  it("explains which section to choose in the message", async () => {
    await expect(
      signIn({ name: "Devon Kestrel", section: "2pm", password: "" }),
    ).rejects.toThrow(/3:00 PM/);
  });

  it("cannot be moved into the wrong section after signing in correctly", async () => {
    const first = await signIn({ name: "Nadia Ashwood", section: "2pm", password: "" });
    await codeOf(() => signIn({ name: "Nadia Ashwood", section: "3pm", password: "" }));

    const stored = await (await getStore()).findStudentById(first.id);
    expect(stored?.section).toBe("2pm");
  });
});

describe("passwords", () => {
  it("claims a name when the first sign-in supplies a password", async () => {
    const created = await signIn({ name: "Nadia Ashwood", section: "2pm", password: "hunter2" });
    expect(created.hasPassword).toBe(true);

    expect(
      await codeOf(() => signIn({ name: "Nadia Ashwood", section: "2pm", password: "" })),
    ).toBe("password_required");
  });

  it("rejects a wrong password", async () => {
    await signIn({ name: "Nadia Ashwood", section: "2pm", password: "hunter2" });

    expect(
      await codeOf(() => signIn({ name: "Nadia Ashwood", section: "2pm", password: "nope" })),
    ).toBe("wrong_password");
  });

  it("accepts the right password", async () => {
    const created = await signIn({ name: "Nadia Ashwood", section: "2pm", password: "hunter2" });
    const returning = await signIn({
      name: "Nadia Ashwood",
      section: "2pm",
      password: "hunter2",
    });

    expect(returning.id).toBe(created.id);
  });

  it("lets an unprotected name claim a password later", async () => {
    const created = await signIn({ name: "Nadia Ashwood", section: "2pm", password: "" });
    expect(created.hasPassword).toBe(false);

    await signIn({ name: "Nadia Ashwood", section: "2pm", password: "later" });

    expect(
      await codeOf(() => signIn({ name: "Nadia Ashwood", section: "2pm", password: "" })),
    ).toBe("password_required");
  });

  it("does not let a password be claimed when that is disabled", async () => {
    vi.stubEnv("ALLOW_PASSWORD_CLAIM", "false");

    await signIn({ name: "Nadia Ashwood", section: "2pm", password: "" });
    const again = await signIn({ name: "Nadia Ashwood", section: "2pm", password: "sneaky" });

    expect(again.hasPassword).toBe(false);
  });

  it("never returns the password hash to callers", async () => {
    const student = await signIn({ name: "Nadia Ashwood", section: "2pm", password: "hunter2" });
    expect(student).not.toHaveProperty("passwordHash");
  });
});

describe("signIn when closed", () => {
  it("refuses once the instructor has locked things", async () => {
    await (await getStore()).setSetting("locked", "closed");

    expect(
      await codeOf(() => signIn({ name: "Nadia Ashwood", section: "2pm", password: "" })),
    ).toBe("locked");
  });

  it("refuses once the deadline has passed", async () => {
    vi.stubEnv("CLOSES_AT", "2000-01-01T00:00:00Z");

    expect(
      await codeOf(() => signIn({ name: "Nadia Ashwood", section: "2pm", password: "" })),
    ).toBe("locked");
  });
});
