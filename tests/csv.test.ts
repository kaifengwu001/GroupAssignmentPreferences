import { describe, expect, it } from "vitest";

import { CSV_BOM, csvFilename, toCsv, toCsvBody } from "@/lib/csv";

describe("toCsvBody", () => {
  it("writes a header row followed by data, CRLF terminated", () => {
    expect(toCsvBody(["name", "section"], [["Nadia", "2pm"]])).toBe(
      "name,section\r\nNadia,2pm\r\n",
    );
  });

  it("emits just the header when there are no rows", () => {
    expect(toCsvBody(["name"], [])).toBe("name\r\n");
  });

  it("quotes fields containing a comma", () => {
    expect(toCsvBody(["name"], [["Ashwood, Nadia"]])).toBe('name\r\n"Ashwood, Nadia"\r\n');
  });

  it("doubles embedded quotes", () => {
    expect(toCsvBody(["pitch"], [['He said "hello"']])).toBe(
      'pitch\r\n"He said ""hello"""\r\n',
    );
  });

  it("quotes fields containing newlines", () => {
    expect(toCsvBody(["pitch"], [["line one\nline two"]])).toBe(
      'pitch\r\n"line one\nline two"\r\n',
    );
  });

  it("renders null and undefined as empty cells", () => {
    expect(toCsvBody(["a", "b"], [[null, undefined]])).toBe("a,b\r\n,\r\n");
  });

  it("keeps numbers unquoted", () => {
    expect(toCsvBody(["rank"], [[2]])).toBe("rank\r\n2\r\n");
  });

  it("does not include a byte-order mark", () => {
    expect(toCsvBody(["name"], [])).not.toContain(CSV_BOM);
  });

  describe("formula injection", () => {
    // These cells would otherwise execute when the instructor opens the file.
    const dangerous = ["=1+1", "+1", "-1", "@SUM(A1)", "=HYPERLINK(\"http://x\")"];

    for (const value of dangerous) {
      it(`neutralises a cell starting with ${value.slice(0, 1)}`, () => {
        const body = toCsvBody(["pitch"], [[value]]);
        expect(body).toContain("'");
        expect(body.startsWith(`pitch\r\n${value}`)).toBe(false);
      });
    }

    it("leaves ordinary text alone", () => {
      expect(toCsvBody(["pitch"], [["A compiler explainer."]])).toBe(
        "pitch\r\nA compiler explainer.\r\n",
      );
    });
  });
});

describe("toCsv", () => {
  it("prefixes exactly one byte-order mark", () => {
    const csv = toCsv(["name"], [["Nadia"]]);

    expect(csv.startsWith(CSV_BOM)).toBe(true);
    expect(csv.split(CSV_BOM)).toHaveLength(2);
  });
});

describe("csvFilename", () => {
  it("stamps the name and keeps the extension", () => {
    expect(csvFilename("students")).toMatch(/^students-\d{4}-\d{2}-\d{2}-\d{2}-\d{2}\.csv$/);
  });
});
