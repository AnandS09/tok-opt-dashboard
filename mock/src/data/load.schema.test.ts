import { afterEach, describe, expect, it } from "vitest";
import {
  appendCsvLine,
  csvDataLines,
  csvLineNumber,
  fixtureText,
  loadFixtureTables,
  replaceCsvLine,
  restoreFetch,
} from "../test/fixtures";

/**
 * The loader's generic schema rules (spec 7.3 "fail loudly"): extra column,
 * empty required cell, enum values, duplicate ids in every file, offer/plan
 * exclusivity, the stage and vendor rules on buying_patterns.csv, a second
 * best_single pattern, and the manifest's positive-number rule. The
 * pattern-file foreign-key rules are in load.test.ts.
 */

afterEach(restoreFetch);

async function failure(overrides: Record<string, string>): Promise<string> {
  try {
    await loadFixtureTables(overrides);
  } catch (error) {
    return error instanceof Error ? error.message : String(error);
  } finally {
    restoreFetch();
  }
  throw new Error(`expected the loader to reject the edited ${Object.keys(overrides).join(", ")}, but it loaded`);
}

describe("an unknown extra column", () => {
  it.each(["models.csv", "hardware.csv", "pattern_popularity.csv", "baseline_providers.csv"])(
    "%s: a column the contract does not list fails, naming it",
    async (file) => {
      const lines = fixtureText(file).trimEnd().split("\n");
      const text = lines.map((line, i) => `${line},${i === 0 ? "surprise" : "x"}`).join("\n");
      expect(await failure({ [file]: text })).toBe(`${file}: column "surprise" is not part of the expected columns`);
    },
  );
});

describe("an empty required cell", () => {
  it("fails, naming file, column and line", async () => {
    const text = replaceCsvLine(
      fixtureText("models.csv"),
      "frontier_a,",
      "frontier_a,,frontier,proprietary,Placeholder vendor 1",
    );
    expect(await failure({ "models.csv": text })).toBe('models.csv: column "family" on line 2 is empty');
  });

  it("fails for an empty pattern_id in baseline_providers.csv, on the right line", async () => {
    const prefix = "api,software_design,";
    const text = replaceCsvLine(fixtureText("baseline_providers.csv"), prefix, ",software_design,frontier_a_direct_global,,1.0");
    expect(await failure({ "baseline_providers.csv": text })).toBe(
      `baseline_providers.csv: column "pattern_id" on line ${csvLineNumber(fixtureText("baseline_providers.csv"), prefix)} is empty`,
    );
  });

  it("is allowed where the contract marks a column optional (an offer with no commit minimum loads)", async () => {
    const tables = await loadFixtureTables();
    expect(tables.model_offers.some((o) => o.min_commit_usd === null)).toBe(true);
  });
});

describe("enum values", () => {
  const cases: [string, string, string, string, string][] = [
    ["models.csv", "frontier_a,", "frontier_a,Frontier model A,huge,proprietary,Placeholder vendor 1", "tier", "frontier, mid, small"],
    ["models.csv", "frontier_a,", "frontier_a,Frontier model A,frontier,free,Placeholder vendor 1", "license", "proprietary, open"],
    [
      "buying_patterns.csv",
      "seats,",
      "seats,Seats,way_to_buy_typo,seats,,list,https://example.invalid/x,2026-10-21",
      "kind",
      "way_to_buy, vendor_end_to_end, best_single",
    ],
    [
      "buying_patterns.csv",
      "seats,",
      "seats,Seats,way_to_buy,seats,,weekly,https://example.invalid/x,2026-10-21",
      "pricing_rule",
      "list, commit",
    ],
    ["pattern_popularity.csv", "api,api,", "api,monthly,1,x", "stage", "seats, api, platform"],
  ];

  it.each(cases)("%s: a value outside the list fails, naming the column and the allowed values", async (file, prefix, line, column, allowed) => {
    const text = replaceCsvLine(fixtureText(file), prefix, line);
    const message = await failure({ [file]: text });
    expect(message).toContain(`${file}: column "${column}" on line ${csvLineNumber(fixtureText(file), prefix)} must be one of ${allowed}, got "`);
  });

  it("an offer channel outside the list fails", async () => {
    const prefix = "frontier_a_direct_global,";
    const text = replaceCsvLine(
      fixtureText("model_offers.csv"),
      prefix,
      "frontier_a_direct_global,frontier_a,carrier_pigeon,global,10.0,50.0,0,,,https://example.invalid/x,2026-10-19,standard,modelled,85,320",
    );
    expect(await failure({ "model_offers.csv": text })).toContain(
      'model_offers.csv: column "channel" on line 2 must be one of direct, bedrock, ec2, neocloud, self-host, got "carrier_pigeon"',
    );
  });
});

describe("duplicate ids in each file", () => {
  it.each([
    ["hardware.csv", "hw_id"],
    ["models.csv", "model_id"],
    ["model_offers.csv", "offer_id"],
    ["seat_plans.csv", "plan_id"],
    ["workloads.csv", "workload_id"],
  ])("%s: a repeated %s fails, naming the line and the id", async (file, column) => {
    const first = csvDataLines(fixtureText(file))[0] as string;
    const id = first.split(",")[0] as string;
    const text = appendCsvLine(fixtureText(file), first);
    const lineNo = csvDataLines(fixtureText(file)).length + 2;
    expect(await failure({ [file]: text })).toBe(`${file}: column "${column}" on line ${lineNo} repeats "${id}"`);
  });
});

describe("a baseline row names exactly one of offer_id and plan_id", () => {
  const prefix = "api,software_design,";
  const file = "baseline_providers.csv";

  it("both filled fails", async () => {
    const text = replaceCsvLine(fixtureText(file), prefix, `${prefix}frontier_a_direct_global,seat_v1_team,1.0`);
    expect(await failure({ [file]: text })).toBe(
      `baseline_providers.csv: columns "offer_id" and "plan_id" on line ${csvLineNumber(fixtureText(file), prefix)}: fill exactly one`,
    );
  });

  it("neither filled fails", async () => {
    const text = replaceCsvLine(fixtureText(file), prefix, `${prefix},,1.0`);
    expect(await failure({ [file]: text })).toBe(
      `baseline_providers.csv: columns "offer_id" and "plan_id" on line ${csvLineNumber(fixtureText(file), prefix)}: fill exactly one`,
    );
  });
});

describe("buying_patterns.csv stage and vendor rules (spec 7.4)", () => {
  const file = "buying_patterns.csv";
  const url = "https://example.invalid/x,2026-10-21";

  it("a vendor_end_to_end pattern with a stage fails", async () => {
    const text = replaceCsvLine(fixtureText(file), "vendor1_direct,", `vendor1_direct,V1,vendor_end_to_end,api,Placeholder vendor 1,list,${url}`);
    expect(await failure({ [file]: text })).toBe(
      `buying_patterns.csv: column "stage" on line ${csvLineNumber(fixtureText(file), "vendor1_direct,")} must be empty for a vendor_end_to_end pattern`,
    );
  });

  it("the best_single pattern with a stage fails", async () => {
    const text = replaceCsvLine(fixtureText(file), "best_single,", `best_single,Best,best_single,api,,commit,${url}`);
    expect(await failure({ [file]: text })).toBe(
      `buying_patterns.csv: column "stage" on line ${csvLineNumber(fixtureText(file), "best_single,")} must be empty for a best_single pattern`,
    );
  });

  it("a vendor_end_to_end pattern with no vendor fails", async () => {
    const text = replaceCsvLine(fixtureText(file), "vendor1_direct,", `vendor1_direct,V1,vendor_end_to_end,,,list,${url}`);
    expect(await failure({ [file]: text })).toBe(
      `buying_patterns.csv: column "vendor" on line ${csvLineNumber(fixtureText(file), "vendor1_direct,")} is required for a vendor_end_to_end pattern`,
    );
  });

  it("two best_single patterns fail", async () => {
    const text = appendCsvLine(fixtureText(file), `best_single_two,Second best,best_single,,,commit,${url}`);
    expect(await failure({ [file]: text })).toBe('buying_patterns.csv: column "kind" has more than one best_single pattern');
  });
});

describe("manifest.json (spec 7.3)", () => {
  const manifest = () => JSON.parse(fixtureText("manifest.json")) as Record<string, any>;
  const withParameter = (key: string, value: unknown): string => {
    const m = manifest();
    m.parameters[key] = value;
    return JSON.stringify(m);
  };

  it.each([[0], [-3], ["63"], [null]])("working_days_per_quarter of %j fails: it must be a positive number", async (value) => {
    expect(await failure({ "manifest.json": withParameter("working_days_per_quarter", value) })).toBe(
      'manifest.json: field "parameters.working_days_per_quarter" must be a positive number',
    );
  });

  it.each([[0], [-1]])("months_per_quarter of %j fails: it must be a positive number", async (value) => {
    expect(await failure({ "manifest.json": withParameter("months_per_quarter", value) })).toBe(
      'manifest.json: field "parameters.months_per_quarter" must be a positive number',
    );
  });

  it("text that is not JSON fails, naming the file", async () => {
    expect(await failure({ "manifest.json": "{not json" })).toMatch(/^manifest\.json: not valid JSON/);
  });

  it("a missing data_version fails", async () => {
    const m = manifest();
    delete m.data_version;
    expect(await failure({ "manifest.json": JSON.stringify(m) })).toBe('manifest.json: field "data_version" must be text');
  });

  it("a latency class with no minimum speed fails, naming it", async () => {
    const m = manifest();
    delete m.parameters.latency_classes.standard.min_tok_s_per_user;
    expect(await failure({ "manifest.json": JSON.stringify(m) })).toBe(
      'manifest.json: field "parameters.latency_classes.standard.min_tok_s_per_user" must be a number',
    );
  });
});

describe("the optional source_url column of hardware.csv and seat_plans.csv (spec 7.3, 15.10)", () => {
  /** The file's text with its `source_url` column cut out of every line. */
  const without = (file: string): string =>
    fixtureText(file)
      .trimEnd()
      .split("\n")
      .map((line) => line.split(",").slice(0, -1).join(","))
      .join("\n") + "\n";

  it("the fixtures hold the column, and every address is the invented placeholder", async () => {
    const tables = await loadFixtureTables();
    for (const row of tables.hardware) expect(row.source_url).toBe(`https://example.invalid/placeholder-invented-data/hardware/${row.hw_id}`);
    for (const row of tables.seat_plans) expect(row.source_url).toBe(`https://example.invalid/placeholder-invented-data/seat_plans/${row.plan_id}`);
  });

  it.each([
    ["hardware.csv", "hardware"],
    ["seat_plans.csv", "seat_plans"],
  ] as const)("%s loads without the column, every row reading as no address", async (file, key) => {
    const text = without(file);
    expect(text.split("\n")[0]).not.toContain("source_url");
    const tables = await loadFixtureTables({ [file]: text });
    expect(tables[key].length).toBeGreaterThan(0);
    for (const row of tables[key]) expect(row.source_url).toBeNull();
  });

  it.each(["hardware.csv", "seat_plans.csv"])("%s loads with an empty cell, that row reading as no address", async (file) => {
    const lines = fixtureText(file).trimEnd().split("\n");
    lines[1] = (lines[1] as string).split(",").slice(0, -1).join(",") + ",";
    const key = file === "hardware.csv" ? "hardware" : "seat_plans";
    const tables = await loadFixtureTables({ [file]: `${lines.join("\n")}\n` });
    expect(tables[key][0]?.source_url).toBeNull();
    expect(tables[key][1]?.source_url).toContain("placeholder-invented-data");
  });

  it("a column the contract does not list is still refused, so the exception is only the optional column", async () => {
    const lines = fixtureText("hardware.csv").trimEnd().split("\n");
    const text = lines.map((line, i) => `${line},${i === 0 ? "surprise" : "x"}`).join("\n");
    expect(await failure({ "hardware.csv": text })).toBe('hardware.csv: column "surprise" is not part of the expected columns');
  });

  it("another file's required column is still required: model_offers.csv without source_url fails", async () => {
    const lines = fixtureText("model_offers.csv").trimEnd().split("\n");
    const cut = lines.map((line) => line.split(",").filter((_, i) => i !== 9).join(","));
    expect(await failure({ "model_offers.csv": `${cut.join("\n")}\n` })).toBe('model_offers.csv: column "source_url" is missing from the header row');
  });
});
