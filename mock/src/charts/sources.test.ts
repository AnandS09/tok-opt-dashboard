import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { beforeAll, describe, expect, it } from "vitest";
import { compute } from "../compute";
import type { Results, Scenario } from "../contract";
import { loadFixtureScenario, loadFixtureTables, restoreFetch } from "../test/fixtures";
import { INFRAVANA_LABEL, SAVINGS_LABEL } from "./labels";
import { infravanaParts, optionParts, todayParts } from "./sourceParts";
import {
  ALL_MEASURED,
  INVENTED_ROW,
  MODELLED_SOURCE,
  NO_ADDRESS,
  PLACEHOLDER_NOTE,
  ProvenanceNotes,
  isLinkable,
  isPlaceholderAddress,
  sourceRowsOf,
} from "./ProvenanceNotes";
import type { ProvenancePart } from "./ProvenanceNotes";

/**
 * Spec 15.10: the "Where these numbers come from" disclosure. One row per
 * provenance and group of the non-measured series; a link to the address the
 * data holds, followed by "placeholder, no source yet" while that address is
 * the invented placeholder; "InfraVana cost model (no external source)" for a
 * modelled row; no row for a measured series; no address typed in code.
 */

const PLACEHOLDER = "https://example.invalid/placeholder-invented-data/offers/a";
const REAL = "https://prices.example.test/real/a";

const parts: ProvenancePart[] = [
  { group: "Today: Pay-as-you-go API", part: "Direct from the model maker", provenance: "vendor_reported", source_url: PLACEHOLDER },
  { group: "With InfraVana", part: "AWS EC2", provenance: "vendor_reported", source_url: REAL },
  { group: "With InfraVana", part: "Saved: better price", provenance: "vendor_reported", source_url: REAL },
  { group: "With InfraVana", part: "Own hardware (MI355X)", provenance: "modelled", source_url: "https://example.invalid/placeholder-invented-data/hardware/x" },
  { group: "Other Today options", part: "Vendor A", provenance: "vendor_reported", source_url: PLACEHOLDER },
  { group: "Other Today options", part: "Vendor B", provenance: "vendor_reported", source_url: REAL },
  { group: "Measured group", part: "Run", provenance: "measured", source_url: REAL },
];

const markup = (list: ProvenancePart[] = parts, extra: { invented?: boolean; size?: "stage" | "thumb" } = {}) =>
  renderToStaticMarkup(createElement(ProvenanceNotes, { size: extra.size ?? "stage", parts: list, invented: extra.invented ?? false }));

describe("sourceRowsOf", () => {
  const rows = sourceRowsOf(parts);

  it("makes one row per provenance and group of the non-measured series, vendor-reported first, in the order drawn", () => {
    expect(rows.map((r) => `${r.provenance}|${r.group}`)).toEqual([
      "vendor_reported|Today: Pay-as-you-go API",
      "vendor_reported|With InfraVana",
      "vendor_reported|Other Today options",
      "modelled|With InfraVana",
    ]);
  });

  it("gives a measured series no row", () => {
    expect(rows.some((r) => r.group === "Measured group")).toBe(false);
    expect(sourceRowsOf([{ group: "A", part: "", provenance: "measured" }])).toEqual([]);
  });

  it("lists what a row covers, each part once", () => {
    expect(rows[1]?.covers).toEqual(["AWS EC2", "Saved: better price"]);
    expect(sourceRowsOf([{ group: "G", part: "P", provenance: "modelled" }, { group: "G", part: "P", provenance: "modelled" }])[0]?.covers).toEqual(["P"]);
  });

  it("links a vendor-reported row to the distinct addresses its parts hold, and flags the placeholder one", () => {
    expect(rows[0]?.links).toEqual([{ url: PLACEHOLDER, placeholder: true, names: ["Direct from the model maker"] }]);
    // Two parts with one address make one link.
    expect(rows[1]?.links).toEqual([{ url: REAL, placeholder: false, names: ["AWS EC2", "Saved: better price"] }]);
    // Two addresses make two links, each naming its parts.
    expect(rows[2]?.links.map((l) => [l.url, l.placeholder])).toEqual([
      [PLACEHOLDER, true],
      [REAL, false],
    ]);
  });

  it("gives a modelled row text and no link, whatever address its part holds", () => {
    expect(rows[3]?.links).toEqual([]);
    expect(rows[3]?.text).toBe(MODELLED_SOURCE);
  });

  it("adds the invented row, as a modelled one, when the chart draws the invented rows", () => {
    const withInvented = sourceRowsOf(parts, true);
    const last = withInvented[withInvented.length - 1];
    expect(last?.group).toBe(INVENTED_ROW.group);
    expect(last?.provenance).toBe("modelled");
    expect(last?.covers).toEqual([INVENTED_ROW.covers]);
    expect(sourceRowsOf(parts).some((r) => r.group === INVENTED_ROW.group)).toBe(false);
  });

  it("names a part with no label by its group", () => {
    const [row] = sourceRowsOf([{ group: "Today", part: "", provenance: "vendor_reported", source_url: REAL }]);
    expect(row?.links[0]?.names).toEqual(["Today"]);
  });
});

describe("addresses", () => {
  it("the placeholder address is recognised by its reserved top-level domain, not by a typed address", () => {
    expect(isPlaceholderAddress(PLACEHOLDER)).toBe(true);
    expect(isPlaceholderAddress("https://example.invalid")).toBe(true);
    expect(isPlaceholderAddress(REAL)).toBe(false);
    expect(isPlaceholderAddress("https://invalid.example.test/x")).toBe(false);
    expect(isPlaceholderAddress("not an address")).toBe(false);
  });

  it("only an absolute http or https address becomes a link", () => {
    expect(isLinkable(REAL)).toBe(true);
    expect(isLinkable("http://prices.example.test/x")).toBe(true);
    expect(isLinkable("javascript:alert(1)")).toBe(false);
    expect(isLinkable("/relative/path")).toBe(false);
    expect(isLinkable("")).toBe(false);
  });
});

describe("the disclosure's markup", () => {
  const html = markup();

  it("is a closed details whose summary reads 'Where these numbers come from'", () => {
    expect(html).toContain('<details class="sources">');
    expect(html).not.toMatch(/<details[^>]*\sopen/);
    expect(html).toContain("<summary>Where these numbers come from</summary>");
  });

  it("opens a table with the four headings and one row per group", () => {
    const heads = [...html.matchAll(/<th scope="col">([^<]*)<\/th>/g)].map((m) => m[1]);
    expect(heads).toEqual(["Bar or group", "Covers", "Basis", "Source"]);
    expect(html.match(/<tbody><tr>|<\/tr><tr>/g)?.length).toBe(4);
  });

  it("writes Basis as 'Vendor-reported' or 'Modelled'", () => {
    expect(html.match(/<td>Vendor-reported<\/td>/g)?.length).toBe(3);
    expect(html.match(/<td>Modelled<\/td>/g)?.length).toBe(1);
  });

  it("links each address and adds the placeholder words exactly after a placeholder address", () => {
    expect(html).toContain(`<a href="${PLACEHOLDER}"`);
    expect(html).toContain(`<a href="${REAL}"`);
    // Three links to a placeholder or real address in the vendor rows: the placeholder words follow the two placeholder links only.
    const withNote = html.match(new RegExp(`</a><em class="sources__note"> ${PLACEHOLDER_NOTE}</em>`, "g")) ?? [];
    expect(withNote.length).toBe(2);
    expect(html.match(/>Price list/g)?.length).toBe(4);
  });

  it("a real address drops the words: the same part given a real address reads without them", () => {
    const real = markup([{ group: "Today", part: "Direct", provenance: "vendor_reported", source_url: REAL }]);
    expect(real).toContain(`<a href="${REAL}"`);
    expect(real).not.toContain(PLACEHOLDER_NOTE);
    const placeholder = markup([{ group: "Today", part: "Direct", provenance: "vendor_reported", source_url: PLACEHOLDER }]);
    expect(placeholder).toContain(PLACEHOLDER_NOTE);
  });

  it("a vendor-reported part with no address says so instead of linking", () => {
    const none = markup([{ group: "Today", part: "Direct", provenance: "vendor_reported" }]);
    expect(none).toContain(NO_ADDRESS);
    expect(none).not.toContain("<a ");
  });

  it("a modelled row says the model is its source and links nowhere", () => {
    const modelled = markup([{ group: "With InfraVana", part: "Routing", provenance: "modelled", source_url: REAL }]);
    expect(modelled).toContain(MODELLED_SOURCE);
    expect(modelled).not.toContain("<a ");
  });

  it("an address that is not http or https is shown as text, never as a link", () => {
    const bad = markup([{ group: "Today", part: "Direct", provenance: "vendor_reported", source_url: "javascript:alert(1)" }]);
    expect(bad).not.toContain("javascript:alert");
    expect(bad).toContain("Price list");
  });

  it("a chart whose series are all measured has the disclosure and no table", () => {
    const measured = markup([{ group: "Today", part: "", provenance: "measured" }]);
    expect(measured).toContain("<summary>Where these numbers come from</summary>");
    expect(measured).toContain(ALL_MEASURED);
    expect(measured).not.toContain("<table");
  });

  it("carries no badge, and the source line follows the disclosure", () => {
    expect(html).not.toMatch(/prov-badge|chart-notes__badges/);
    expect(html.indexOf("</details>")).toBeLessThan(html.indexOf('<p class="chart-source">'));
    expect(html).toContain("<b>Source:</b> InfraVana cost model on illustrative price tables.");
  });

  it("the invented rows add their row and the invented source line", () => {
    const invented = markup(parts, { invented: true });
    expect(invented).toContain(INVENTED_ROW.covers);
    expect(invented).toContain("<b>Source:</b> invented placeholder data.");
    expect(markup(parts)).not.toContain(INVENTED_ROW.covers);
  });

  it("a thumbnail is nothing but the picture", () => {
    expect(markup(parts, { size: "thumb" })).toBe("");
  });
});

describe("the parts a chart hands to the table, read from Results", () => {
  let r: Results;
  let s1: Scenario;
  beforeAll(async () => {
    const tables = await loadFixtureTables();
    s1 = await loadFixtureScenario("s1");
    restoreFetch();
    r = compute(s1, tables);
  });

  it("InfraVana's parts are its spend segments and each source of saving that is not zero, with their addresses", () => {
    const parts = infravanaParts(r);
    const saved = r.allocation.infravana.filter((s) => s.kind === "savings" && s.usd > 0);
    expect(saved.length).toBeGreaterThan(0);
    for (const s of saved) {
      if (s.kind !== "savings") continue;
      const part = parts.find((p) => p.part === SAVINGS_LABEL[s.savings_source]);
      expect(part, s.savings_source).toBeDefined();
      expect(part?.provenance).toBe(s.provenance);
      expect(part?.source_url).toBe(s.source_url);
    }
    expect(parts.every((p) => p.group === INFRAVANA_LABEL)).toBe(true);
    expect(parts.length).toBe(r.allocation.infravana.filter((s) => s.kind !== "savings" || s.usd > 0).length);
  });

  it("a segment folded into 'Other' on the bar is still listed by its own name", () => {
    expect(todayParts(r).map((p) => p.part).length).toBe(r.allocation.today.length);
  });

  it("each other Today option carries its provenance and its pattern's address", () => {
    const parts = optionParts(r);
    expect(parts.length).toBeGreaterThan(0);
    for (const p of parts) {
      const alt = r.today_alternatives.find((a) => a.label === p.part);
      expect(p.provenance).toBe(alt?.provenance);
      expect(p.source_url).toBe(alt?.source_url);
    }
  });
});
