import { afterEach, describe, expect, it } from "vitest";
import { compute } from "../compute";
import {
  appendCsvLine,
  csvDataLines,
  csvLineNumber,
  fixtureText,
  loadFixtureScenario,
  loadFixtureTables,
  replaceCsvLine,
  restoreFetch,
} from "../test/fixtures";

afterEach(restoreFetch);

const BASELINE = "baseline_providers.csv";
const PATTERNS = "buying_patterns.csv";
const POPULARITY = "pattern_popularity.csv";

/** Loads the fixtures with one file replaced and returns the error the loader throws, or null if it loads. */
async function loadError(file: string, text: string): Promise<string | null> {
  try {
    await loadFixtureTables({ [file]: text });
    return null;
  } catch (error) {
    return error instanceof Error ? error.message : String(error);
  } finally {
    restoreFetch();
  }
}

/** Like `loadError`, but a load that succeeds is a test failure with a plain message. */
async function loadFails(file: string, text: string): Promise<string> {
  const message = await loadError(file, text);
  if (message === null) throw new Error(`expected the loader to reject the edited ${file}, but it loaded`);
  return message;
}

/** The line a row appended to `file` will have: header is line 1. */
const nextLine = (file: string) => csvDataLines(fixtureText(file)).length + 2;

describe("the loader reads the unedited fixtures (the control for every fail-loudly case below)", () => {
  it("loads, with the row counts the data README states", async () => {
    const tables = await loadFixtureTables();
    expect(tables.buying_patterns).toHaveLength(7);
    expect(tables.pattern_popularity).toHaveLength(17);
    expect(tables.baseline_providers).toHaveLength(48);
  });
});

describe("spec 7.4 foreign keys: a pattern_id must exist in buying_patterns.csv", () => {
  it("a baseline_providers row with an unknown pattern_id fails, naming file, column, line and value", async () => {
    const text = appendCsvLine(fixtureText(BASELINE), "no_such_pattern,software_design,mid_a_direct_global,,1.0");
    const message = await loadFails(BASELINE, text);
    expect(message).toBe(
      `baseline_providers.csv: column "pattern_id" on line ${nextLine(BASELINE)} refers to "no_such_pattern", which is not in buying_patterns.csv`,
    );
  });

  it("a pattern_popularity row with an unknown pattern_id fails, naming file, column, line and value", async () => {
    const text = appendCsvLine(fixtureText(POPULARITY), "no_such_pattern,api,7,x");
    const message = await loadFails(POPULARITY, text);
    expect(message).toBe(
      `pattern_popularity.csv: column "pattern_id" on line ${nextLine(POPULARITY)} refers to "no_such_pattern", which is not in buying_patterns.csv`,
    );
  });

  it("a baseline_providers row for the derived best_single pattern fails, because it has no rows", async () => {
    const text = appendCsvLine(fixtureText(BASELINE), "best_single,software_design,mid_a_direct_global,,1.0");
    const message = await loadFails(BASELINE, text);
    expect(message).toContain(`${BASELINE}: column "pattern_id" on line ${nextLine(BASELINE)}`);
    expect(message).toContain("best_single");
    expect(message).toContain("has no rows");
  });
});

describe("spec 7.4: a vendor_end_to_end pattern buys only that vendor's models", () => {
  it("a vendor2_direct row buying vendor 1's model fails, naming both vendors and the line", async () => {
    const prefix = "vendor2_direct,software_design,";
    const text = replaceCsvLine(fixtureText(BASELINE), prefix, `${prefix}frontier_a_direct_global,,1.0`);
    const message = await loadFails(BASELINE, text);
    expect(message).toBe(
      `baseline_providers.csv: column "offer_id" on line ${csvLineNumber(fixtureText(BASELINE), prefix)} buys "frontier_a_direct_global", a model of vendor "Placeholder vendor 1", but pattern vendor2_direct is an end-to-end pattern of vendor "Placeholder vendor 2"`,
    );
  });

  it("a vendor1_direct row buying an open-weight publisher's model fails the same way", async () => {
    const prefix = "vendor1_direct,support,";
    const text = replaceCsvLine(fixtureText(BASELINE), prefix, `${prefix}open_x_neocloud_useast,,1.0`);
    const message = await loadFails(BASELINE, text);
    expect(message).toContain(`on line ${csvLineNumber(fixtureText(BASELINE), prefix)}`);
    expect(message).toContain('a model of vendor "Placeholder publisher 1"');
    expect(message).toContain('end-to-end pattern of vendor "Placeholder vendor 1"');
  });

  it("a vendor pattern may buy a different offer of its own vendor's model (the check is the vendor, not the offer)", async () => {
    const prefix = "vendor2_direct,software_design,";
    const text = replaceCsvLine(fixtureText(BASELINE), prefix, `${prefix}frontier_b_ec2_useast,,1.0`);
    expect(await loadError(BASELINE, text)).toBeNull();
  });
});

describe("pattern_popularity.csv rules (spec 7.4)", () => {
  it("a row for best_single fails: it is derived and never ranked", async () => {
    const text = appendCsvLine(fixtureText(POPULARITY), "best_single,api,1,x");
    const message = await loadFails(POPULARITY, text);
    expect(message).toBe(
      `pattern_popularity.csv: column "pattern_id" on line ${nextLine(POPULARITY)} names the best_single pattern, which is derived and never ranked`,
    );
  });

  it("a second row for the same pattern and stage fails, naming the pattern and the stage", async () => {
    const text = appendCsvLine(fixtureText(POPULARITY), "api,api,7,duplicate");
    const message = await loadFails(POPULARITY, text);
    expect(message).toBe(
      `pattern_popularity.csv: column "stage" on line ${nextLine(POPULARITY)} ranks "api" twice for stage "api"`,
    );
  });

  it("the same pattern may be ranked once for each stage (the fixtures do exactly that)", async () => {
    const tables = await loadFixtureTables();
    const apiRows = tables.pattern_popularity.filter((r) => r.pattern_id === "api");
    expect(apiRows.map((r) => r.stage).sort()).toEqual(["api", "platform", "seats"]);
  });

  it("a gap in the ranks is accepted, not an error: ties are allowed (spec 7.4), so ranks need not run 1..n", async () => {
    // vendor2_direct goes from rank 2 to rank 9 at stage api: ranks 1, 3, 4, 5, 6, 9.
    const text = replaceCsvLine(fixtureText(POPULARITY), "vendor2_direct,api,", "vendor2_direct,api,9,gap");
    expect(await loadError(POPULARITY, text)).toBeNull();

    // The order follows the ranks across the gap: vendor2_direct drops out of the top four.
    const tables = await loadFixtureTables({ [POPULARITY]: text });
    const s1 = await loadFixtureScenario("s1");
    const greys = compute(s1, tables)
      .today_alternatives.filter((a) => a.is_grey)
      .map((a) => a.pattern_id);
    expect(greys).toEqual(["api", "platform", "seats", "vendor1_direct"]);
  });

  it.each([
    ["0", /column "popularity_rank" on line \d+ must be a whole number from 1/],
    ["-1", /column "popularity_rank" on line \d+ must be a whole number from 1/],
    ["1.5", /column "popularity_rank" on line \d+ must be a whole number from 1/],
    ["first", /column "popularity_rank" on line \d+ must be a number, got "first"/],
  ])("a rank of %s fails, naming the column and line", async (rank, pattern) => {
    const text = replaceCsvLine(fixtureText(POPULARITY), "api,api,", `api,api,${rank},bad`);
    const message = await loadFails(POPULARITY, text);
    expect(message).toMatch(pattern);
    expect(message).toContain("pattern_popularity.csv");
    expect(message).toContain(`on line ${csvLineNumber(text, "api,api,")}`);
  });
});

describe("other loud failures on the pattern files", () => {
  it("a missing file names the file and the HTTP status", async () => {
    await expect(loadFixtureTables({ [POPULARITY]: null })).rejects.toThrow(
      "pattern_popularity.csv: could not be fetched (HTTP 404)",
    );
  });

  it("a repeated pattern_id in buying_patterns.csv fails, naming the line", async () => {
    const text = appendCsvLine(
      fixtureText(PATTERNS),
      "api,Another,way_to_buy,api,,list,https://example.invalid/x,2026-10-21",
    );
    expect(await loadFails(PATTERNS, text)).toBe(
      `buying_patterns.csv: column "pattern_id" on line ${nextLine(PATTERNS)} repeats "api"`,
    );
  });

  it("a way_to_buy pattern without a stage fails", async () => {
    const text = replaceCsvLine(
      fixtureText(PATTERNS),
      "seats,",
      "seats,Seats,way_to_buy,,,list,https://example.invalid/x,2026-10-21",
    );
    expect(await loadFails(PATTERNS, text)).toBe(
      `buying_patterns.csv: column "stage" on line ${csvLineNumber(fixtureText(PATTERNS), "seats,")} is required for a way_to_buy pattern`,
    );
  });

  it("a stage with two typical buyers fails", async () => {
    const text = appendCsvLine(
      fixtureText(PATTERNS),
      "api_two,Second API,way_to_buy,api,,list,https://example.invalid/x,2026-10-21",
    );
    expect(await loadFails(PATTERNS, text)).toContain('needs exactly one way_to_buy pattern for stage "api", found 2');
  });

  it("a missing column in the header names the column", async () => {
    const lines = fixtureText(POPULARITY).trimEnd().split("\n");
    const text = lines.map((l) => l.replace(/,[^,]*$/, "")).join("\n");
    expect(await loadFails(POPULARITY, text)).toBe(
      'pattern_popularity.csv: column "popularity_source" is missing from the header row',
    );
  });

  it("a baseline share that does not sum to 1 fails, naming the pattern and workload", async () => {
    const prefix = "api,software_design,";
    const text = replaceCsvLine(fixtureText(BASELINE), prefix, `${prefix}frontier_a_direct_global,,0.5`);
    expect(await loadFails(BASELINE, text)).toBe(
      'baseline_providers.csv: column "share_default" for pattern api and workload software_design sums to 0.5, not 1',
    );
  });
});
