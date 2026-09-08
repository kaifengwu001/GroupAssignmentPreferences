import { beforeEach, describe, expect, it } from "vitest";

import { hashPassword, matchesSecret, verifyPassword } from "@/lib/auth/password";
import { clientKey, enforceRateLimit } from "@/lib/api/rate-limit";
import { originFromHeaders } from "@/lib/qr";

import { resetStore } from "./helpers/reset";

describe("password hashing", () => {
  it("verifies a correct password", async () => {
    const stored = await hashPassword("hunter2");
    expect(await verifyPassword("hunter2", stored)).toBe(true);
  });

  it("rejects a wrong password", async () => {
    const stored = await hashPassword("hunter2");
    expect(await verifyPassword("hunter3", stored)).toBe(false);
  });

  it("never stores the password itself", async () => {
    const stored = await hashPassword("hunter2");
    expect(stored).not.toContain("hunter2");
  });

  it("salts, so the same password hashes differently each time", async () => {
    expect(await hashPassword("hunter2")).not.toBe(await hashPassword("hunter2"));
  });

  it("is case sensitive", async () => {
    const stored = await hashPassword("Hunter2");
    expect(await verifyPassword("hunter2", stored)).toBe(false);
  });

  it("handles unicode passwords", async () => {
    const stored = await hashPassword("pässwörd-✓");
    expect(await verifyPassword("pässwörd-✓", stored)).toBe(true);
  });

  describe("malformed stored values", () => {
    // A corrupted or hand-edited column must fail closed, never throw.
    const malformed = ["", "garbage", "scrypt$onlytwo", "bcrypt$a$b", "scrypt$YQ==$YQ=="];

    for (const stored of malformed) {
      it(`returns false for ${JSON.stringify(stored)}`, async () => {
        expect(await verifyPassword("hunter2", stored)).toBe(false);
      });
    }
  });
});

describe("matchesSecret", () => {
  it("accepts an exact match", () => {
    expect(matchesSecret("s3cret", "s3cret")).toBe(true);
  });

  it("rejects a mismatch of the same length", () => {
    expect(matchesSecret("s3cret", "s3cr3t")).toBe(false);
  });

  it("rejects a mismatch of a different length without throwing", () => {
    // timingSafeEqual throws on length mismatch, so this path is guarded.
    expect(matchesSecret("short", "a-much-longer-secret")).toBe(false);
    expect(matchesSecret("", "secret")).toBe(false);
  });

  it("rejects a prefix of the real secret", () => {
    expect(matchesSecret("s3c", "s3cret")).toBe(false);
  });
});

describe("rate limiting", () => {
  beforeEach(() => {
    resetStore();
  });

  it("allows requests up to the limit", () => {
    for (let attempt = 0; attempt < 3; attempt += 1) {
      expect(() => enforceRateLimit("login:1.1.1.1", 3, 60_000)).not.toThrow();
    }
  });

  it("throws 429 on the request past the limit", () => {
    for (let attempt = 0; attempt < 3; attempt += 1) enforceRateLimit("login:2.2.2.2", 3, 60_000);

    expect(() => enforceRateLimit("login:2.2.2.2", 3, 60_000)).toThrow(/too many attempts/i);
  });

  it("reports the status the API layer turns into a response", () => {
    enforceRateLimit("login:5.5.5.5", 1, 60_000);

    expect(() => enforceRateLimit("login:5.5.5.5", 1, 60_000)).toThrow(
      expect.objectContaining({ status: 429 }),
    );
  });

  it("keeps separate callers in separate buckets", () => {
    enforceRateLimit("login:3.3.3.3", 1, 60_000);
    expect(() => enforceRateLimit("login:4.4.4.4", 1, 60_000)).not.toThrow();
  });

  it("forgets a window once it has elapsed", () => {
    enforceRateLimit("login:6.6.6.6", 1, -1);
    expect(() => enforceRateLimit("login:6.6.6.6", 1, -1)).not.toThrow();
  });
});

describe("clientKey", () => {
  const keyFor = (headers: Record<string, string>) =>
    clientKey(new Request("http://localhost/api", { headers }), "login");

  it("prefers the first hop of x-forwarded-for", () => {
    expect(keyFor({ "x-forwarded-for": "9.9.9.9, 10.0.0.1" })).toBe("login:9.9.9.9");
  });

  it("falls back to x-real-ip", () => {
    expect(keyFor({ "x-real-ip": "8.8.8.8" })).toBe("login:8.8.8.8");
  });

  it("degrades to a shared bucket when no headers are present", () => {
    expect(keyFor({})).toBe("login:unknown");
  });

  it("namespaces by scope so routes cannot exhaust each other", () => {
    const request = new Request("http://localhost/api", { headers: { "x-real-ip": "8.8.8.8" } });

    expect(clientKey(request, "login")).not.toBe(clientKey(request, "admin-login"));
  });
});

describe("originFromHeaders", () => {
  const origin = (headers: Record<string, string>) => originFromHeaders(new Headers(headers));

  it("trusts the proxy's forwarded host and protocol", () => {
    expect(origin({ "x-forwarded-host": "pitch.example.com", "x-forwarded-proto": "https" })).toBe(
      "https://pitch.example.com",
    );
  });

  it("assumes https for a non-local host", () => {
    expect(origin({ host: "pitch.example.com" })).toBe("https://pitch.example.com");
  });

  it("assumes http for localhost, so the dev QR code works", () => {
    expect(origin({ host: "localhost:3000" })).toBe("http://localhost:3000");
  });

  it("falls back to the dev origin when nothing is set", () => {
    expect(origin({})).toBe("http://localhost:3000");
  });
});
