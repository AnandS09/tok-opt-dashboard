import { describe, expect, it } from "vitest";
import { chartRegistry } from "../charts/registry";
import type { ChartId } from "../contract";
import { CHART_LISTING, listCharts, type GlyphForm } from "./chartListing";
import { announcement } from "./stage";

const FORMS: GlyphForm[] = ["bars", "columns", "step", "line", "scatter", "flow"];
const ALL_IDS: ChartId[] = ["C1", "C2", "C3", "C4", "C5", "C6", "C7", "C8", "C9", "C10"];

describe("the chart listing (spec 15.8: ten charts, C1 to C10)", () => {
  it("holds every id of the registry once, built charts first in registry order", () => {
    expect(CHART_LISTING).toHaveLength(10);
    expect([...CHART_LISTING.map((c) => c.id)].sort()).toEqual([...ALL_IDS].sort());
    expect(CHART_LISTING.slice(0, chartRegistry.length).map((c) => c.id)).toEqual(chartRegistry.map((def) => def.id));
  });

  it("gives every chart one of the six glyph forms, as board 08 assigns them", () => {
    for (const entry of CHART_LISTING) expect(FORMS).toContain(entry.glyph);
    const byId = Object.fromEntries(CHART_LISTING.map((c) => [c.id, c.glyph]));
    expect(byId).toMatchObject({ C1: "bars", C5: "bars", C3: "columns", C10: "step", C2: "line", C4: "scatter", C6: "flow" });
    expect(new Set(CHART_LISTING.map((c) => c.glyph)).size).toBe(6);
  });

  it("repeats each built chart's registry title exactly, so a rename cannot leave the board's text behind", () => {
    for (const def of chartRegistry) {
      expect(CHART_LISTING.find((c) => c.id === def.id)?.title).toBe(def.title);
    }
  });

  it("has no digit and no registry id in any title (spec 15.9)", () => {
    for (const entry of CHART_LISTING) {
      expect(entry.title, entry.id).not.toMatch(/\d/);
      expect(entry.title, entry.id).not.toMatch(/\bC\d+\b/);
    }
    expect(new Set(CHART_LISTING.map((c) => c.title)).size).toBe(10);
  });
});

describe("listCharts", () => {
  it("lists ten, shows the built charts at their slide index and marks the others planned", () => {
    const listed = listCharts(chartRegistry, chartRegistry);
    expect(listed).toHaveLength(10);
    expect(listed.filter((c) => c.state === "shown").map((c) => [c.id, c.slide])).toEqual(
      chartRegistry.map((def, i) => [def.id, i]),
    );
    expect(listed.filter((c) => c.state === "planned")).toHaveLength(10 - chartRegistry.length);
    for (const c of listed.filter((entry) => entry.state === "planned")) expect(c.slide).toBeNull();
  });

  it("takes each built chart's title from the registry and none from a position", () => {
    for (const c of listCharts(chartRegistry, chartRegistry).filter((entry) => entry.state === "shown")) {
      expect(c.title).toBe(chartRegistry.find((def) => def.id === c.id)?.title);
    }
  });

  it("marks a built chart that the scenario does not list as hidden, not planned", () => {
    const shown = chartRegistry.filter((def) => def.id !== "C5");
    const c5 = listCharts(shown, chartRegistry).find((c) => c.id === "C5");
    expect(c5).toMatchObject({ state: "hidden", slide: null });
    // The slide indices follow the charts the stage shows.
    expect(listCharts(shown, chartRegistry).find((c) => c.id === "C3")?.slide).toBe(1);
  });
});

describe("the live region's text (spec 15.9 acceptance 4)", () => {
  it("is the new chart's title alone, with no ordinal or count", () => {
    for (const def of chartRegistry) {
      expect(announcement(def)).toBe(def.title);
      expect(announcement(def)).not.toMatch(/figure|\d/i);
    }
    const texts = chartRegistry.map((def) => announcement(def));
    expect(new Set(texts).size).toBe(texts.length); // it changes on every change of chart
  });
});
