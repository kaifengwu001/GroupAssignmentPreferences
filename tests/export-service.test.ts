import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { CSV_BOM } from "@/lib/csv";
import { buildExport, EXPORT_FORMATS, isExportFormat } from "@/lib/services/export-service";
import { savePreferences } from "@/lib/services/preference-service";
import { getStore } from "@/lib/store";

import { resetStore } from "./helpers/reset";

/**
 * The CSV is the whole point of the tool, so these assert the numbers an
 * instructor would actually read off the file.
 */

type Seeded = Record<"nadia" | "marcus" | "priya" | "devon", string>;

async function seed(): Promise<Seeded> {
  const store = await getStore();

  const make = async (name: string, section: "2pm" | "3pm") =>
    (
      await store.createStudent({
        name,
        nameKey: name.toLowerCase(),
        section,
        passwordHash: null,
      })
    ).id;

  const seeded: Seeded = {
    nadia: await make("Nadia", "2pm"),
    marcus: await make("Marcus", "2pm"),
    priya: await make("Priya", "2pm"),
    devon: await make("Devon", "3pm"),
  };

  await store.updatePitch(seeded.nadia, "A packet-routing sandbox.");

  // Nadia and Marcus pick each other; Nadia also ranks Priya second.
  await savePreferences(seeded.nadia, [seeded.marcus, seeded.priya]);
  await savePreferences(seeded.marcus, [seeded.nadia]);

  return seeded;
}

/** Splits a CSV into rows keyed by the first column. */
function rowsByFirstCell(csv: string): Map<string, string> {
  return new Map(
    csv
      .replace(CSV_BOM, "")
      .split("\r\n")
      .filter((line) => line.length > 0)
      .map((line) => [line.split(",")[0].replace(/^"|"$/g, ""), line]),
  );
}

beforeEach(() => {
  resetStore();
});

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("isExportFormat", () => {
  it("accepts the three known formats", () => {
    for (const format of EXPORT_FORMATS) expect(isExportFormat(format)).toBe(true);
  });

  it("rejects anything else", () => {
    expect(isExportFormat("../../etc/passwd")).toBe(false);
    expect(isExportFormat("")).toBe(false);
  });
});

describe("students export", () => {
  it("records each choice in rank order", async () => {
    await seed();
    const rows = rowsByFirstCell(await buildExport("students"));

    const nadia = rows.get("Nadia") ?? "";
    expect(nadia).toContain("1. Marcus; 2. Priya");
  });

  it("puts the top choice in choice_1", async () => {
    await seed();
    const csv = await buildExport("students");
    const header = csv.replace(CSV_BOM, "").split("\r\n")[0].split(",");
    const nadia = (rowsByFirstCell(csv).get("Nadia") ?? "").split(",");

    expect(nadia[header.indexOf("choice_1")]).toBe("Marcus");
    expect(nadia[header.indexOf("choice_2")]).toBe("Priya");
    expect(nadia[header.indexOf("num_choices")]).toBe("2");
  });

  it("labels the section in words", async () => {
    await seed();
    const rows = rowsByFirstCell(await buildExport("students"));

    expect(rows.get("Nadia")).toContain("2:00 PM");
    expect(rows.get("Devon")).toContain("3:00 PM");
  });

  it("reports who chose a student and at what rank", async () => {
    await seed();
    const rows = rowsByFirstCell(await buildExport("students"));

    // Priya was Nadia's second choice, and that rank must survive the flip.
    expect(rows.get("Priya")).toContain("2. Nadia");
  });

  it("identifies the mutual pair", async () => {
    await seed();
    const rows = rowsByFirstCell(await buildExport("students"));

    expect(rows.get("Nadia")).toContain("Marcus");
    expect(rows.get("Marcus")).toContain("Nadia");
  });

  it("includes a student who has done nothing at all", async () => {
    await seed();
    const rows = rowsByFirstCell(await buildExport("students"));

    expect(rows.has("Devon")).toBe(true);
    expect(rows.get("Devon")).toContain("no");
  });

  it("starts with exactly one byte-order mark", async () => {
    await seed();
    const csv = await buildExport("students");

    expect(csv.startsWith(CSV_BOM)).toBe(true);
    expect(csv.split(CSV_BOM)).toHaveLength(2);
  });
});

describe("pairs export", () => {
  it("emits one row per choice, carrying the rank", async () => {
    await seed();
    const lines = (await buildExport("pairs")).replace(CSV_BOM, "").trim().split("\r\n");

    expect(lines[0]).toBe("chooser,section,chosen,rank,mutual");
    expect(lines).toContain("Nadia,2:00 PM,Marcus,1,yes");
    expect(lines).toContain("Nadia,2:00 PM,Priya,2,no");
  });

  it("omits students who chose nobody", async () => {
    await seed();
    const csv = await buildExport("pairs");

    expect(csv).not.toContain("Devon,");
  });
});

describe("matrix export", () => {
  it("carries exactly one byte-order mark despite one block per section", async () => {
    await seed();
    const csv = await buildExport("matrix");

    // The bug this guards: a BOM prepended per block leaves stray glyphs
    // partway down the file.
    expect(csv.startsWith(CSV_BOM)).toBe(true);
    expect(csv.split(CSV_BOM)).toHaveLength(2);
  });

  it("emits a block per section", async () => {
    await seed();
    const csv = await buildExport("matrix");

    expect(csv).toContain("2:00 PM");
    expect(csv).toContain("3:00 PM");
  });

  it("puts the rank in the cell and x on the diagonal", async () => {
    await seed();
    const lines = (await buildExport("matrix")).replace(CSV_BOM, "").split("\r\n");
    const header = lines.find((line) => line.includes("chooser"))?.split(",") ?? [];
    const nadia = lines.find((line) => line.startsWith("Nadia"))?.split(",") ?? [];

    expect(nadia[header.indexOf("Marcus")]).toBe("1");
    expect(nadia[header.indexOf("Priya")]).toBe("2");
    expect(nadia[header.indexOf("Nadia")]).toBe("x");
  });

  it("uses 0 for a classmate who was not chosen", async () => {
    await seed();
    const lines = (await buildExport("matrix")).replace(CSV_BOM, "").split("\r\n");
    const header = lines.find((line) => line.includes("chooser"))?.split(",") ?? [];
    const marcus = lines.find((line) => line.startsWith("Marcus"))?.split(",") ?? [];

    expect(marcus[header.indexOf("Priya")]).toBe("0");
  });

  it("says so when a section is empty", async () => {
    const store = await getStore();
    await store.createStudent({
      name: "Nadia",
      nameKey: "nadia",
      section: "2pm",
      passwordHash: null,
    });

    expect(await buildExport("matrix")).toContain("No students yet");
  });
});

describe("pitch text safety", () => {
  it("neutralises a pitch that would run as a spreadsheet formula", async () => {
    const store = await getStore();
    const student = await store.createStudent({
      name: "Nadia",
      nameKey: "nadia",
      section: "2pm",
      passwordHash: null,
    });
    await store.updatePitch(student.id, "=HYPERLINK(\"http://evil\",\"click\")");

    const csv = await buildExport("students");
    expect(csv).not.toContain(",=HYPERLINK");
    expect(csv).toContain("'=HYPERLINK");
  });

  it("quotes a pitch containing commas without splitting the row", async () => {
    const store = await getStore();
    const student = await store.createStudent({
      name: "Nadia",
      nameKey: "nadia",
      section: "2pm",
      passwordHash: null,
    });
    await store.updatePitch(student.id, "One, two, three.");

    expect(await buildExport("students")).toContain('"One, two, three."');
  });
});
