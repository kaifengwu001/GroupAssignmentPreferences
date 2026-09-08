import { describe, expect, it } from "vitest";

import { displayName, nameTokens, normalizeName, sortByName, toNameKey } from "@/lib/names";

describe("normalizeName", () => {
  it("collapses runs of whitespace and trims", () => {
    expect(normalizeName("  Nadia   Ashwood \n")).toBe("Nadia Ashwood");
  });

  it("leaves the student's own casing alone", () => {
    expect(normalizeName("nadia ASHWOOD")).toBe("nadia ASHWOOD");
  });
});

describe("toNameKey", () => {
  /** Every spelling in each group must resolve to one student. */
  const equivalent: readonly (readonly string[])[] = [
    // A roster kept as "Last, First" versus how a student types themselves.
    ["Ashwood, Nadia", "Nadia Ashwood", "nadia ashwood", "ASHWOOD, NADIA", " Nadia   Ashwood "],
    // Two-word surnames survive the flip in either direction.
    ["Okonjo Blake, Marcus", "Marcus Okonjo Blake", "okonjo blake, marcus"],
    // Hyphens are separators, so hyphenated and spaced forms agree.
    ["Rivera-Santos, Priya", "Priya Rivera-Santos", "Priya Rivera Santos"],
    // Apostrophes are dropped rather than split.
    ["O'Donnell, Fionn", "Fionn O'Donnell", "Fionn ODonnell", "fionn odonnell"],
    // Accents are folded away, since keyboards vary.
    ["Ferrán, Lucía", "Lucia Ferran", "lucía ferrán", "FERRAN, LUCIA"],
  ];

  for (const [canonical, ...variants] of equivalent) {
    for (const variant of variants) {
      it(`matches "${variant}" to "${canonical}"`, () => {
        expect(toNameKey(variant)).toBe(toNameKey(canonical));
      });
    }
  }

  it("keeps genuinely different people apart", () => {
    const keys = [
      "Ashwood, Nadia",
      "Ashwood, Nadir",
      "Kestrel, Devon",
      "Okonjo Blake, Marcus",
      "Okonjo, Marcus",
    ].map(toNameKey);

    expect(new Set(keys).size).toBe(keys.length);
  });

  it("is empty for input with no alphanumerics", () => {
    expect(toNameKey("  ,, -- '' ")).toBe("");
    expect(toNameKey("")).toBe("");
  });

  it("ignores middle-name punctuation styles", () => {
    expect(toNameKey("Ashwood, Nadia J.")).toBe(toNameKey("Nadia J Ashwood"));
  });

  it("does not match a hyphenated surname typed as one word", () => {
    // Treating "-" as a separator is a choice: it buys "Rivera Santos", which
    // students really do type, at the cost of "riverasantos", which they do not.
    expect(toNameKey("riverasantos, priya")).not.toBe(toNameKey("Rivera-Santos, Priya"));
  });

  it("collides for names that are word-anagrams of each other", () => {
    // A known and accepted consequence of order-insensitive matching. The
    // roster integrity test is what keeps this from mattering in practice.
    expect(toNameKey("Kestrel, Devon")).toBe(toNameKey("Devon, Kestrel"));
  });
});

describe("nameTokens", () => {
  it("sorts parts so order cannot affect the result", () => {
    expect(nameTokens("Okonjo Blake, Marcus")).toEqual(["blake", "marcus", "okonjo"]);
  });
});

describe("displayName", () => {
  it("flips a comma-form roster entry into natural order", () => {
    expect(displayName("Ashwood, Nadia")).toBe("Nadia Ashwood");
  });

  it("keeps two-word surnames together when flipping", () => {
    expect(displayName("Okonjo Blake, Marcus")).toBe("Marcus Okonjo Blake");
  });

  it("keeps multi-word given names together when flipping", () => {
    expect(displayName("Lindqvist, Sasha Mira")).toBe("Sasha Mira Lindqvist");
  });

  it("leaves a name that is already in natural order untouched", () => {
    expect(displayName("Nadia Ashwood")).toBe("Nadia Ashwood");
  });

  it("preserves accents and hyphens, which are part of the name", () => {
    expect(displayName("Rivera-Santos, Priya")).toBe("Priya Rivera-Santos");
    expect(displayName("Ferrán, Lucía")).toBe("Lucía Ferrán");
  });

  it("treats a dangling comma as noise rather than a swap", () => {
    expect(displayName("Ashwood,")).toBe("Ashwood");
    expect(displayName(", Nadia")).toBe("Nadia");
  });

  it("normalises whitespace around the comma", () => {
    expect(displayName("Ashwood ,   Nadia")).toBe("Nadia Ashwood");
  });
});

describe("sortByName", () => {
  it("orders case-insensitively", () => {
    const sorted = sortByName([{ name: "devon kestrel" }, { name: "Ashwood" }, { name: "Zoe" }]);
    expect(sorted.map((entry) => entry.name)).toEqual(["Ashwood", "devon kestrel", "Zoe"]);
  });

  it("does not mutate its input", () => {
    const input = [{ name: "Zoe" }, { name: "Ashwood" }];
    const sorted = sortByName(input);

    expect(input.map((entry) => entry.name)).toEqual(["Zoe", "Ashwood"]);
    expect(sorted).not.toBe(input);
  });
});
