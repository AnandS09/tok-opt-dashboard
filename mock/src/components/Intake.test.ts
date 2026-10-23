import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, beforeAll, describe, expect, it } from "vitest";
import type { Scenario, Tables } from "../contract";
import { loadFixtureScenario, loadFixtureTables, restoreFetch } from "../test/fixtures";
import { beginIntake, companyOf, setBudget, setCustomers, setUsers, type CompanyType } from "../store/intake";
import { IntakeAnswers, IntakeQuestions } from "./Intake";

/**
 * Markup checks of the first render of the guided questions and of the answer
 * grid (server render, no browser). The layout itself (widths, edges, colours)
 * is measured in a real browser by docs/build-v04/intake/drive.mjs.
 */

afterEach(restoreFetch);

let tables: Tables;
let s1: Scenario;
beforeAll(async () => {
  tables = await loadFixtureTables();
  s1 = await loadFixtureScenario("s1");
  restoreFetch();
});

const noop = () => {};

function questions(): string {
  return renderToStaticMarkup(
    createElement(IntakeQuestions, { tables, scenario: s1, company: null, contactUrl: "#contact", onCompany: noop, onEdit: noop, onDone: noop }),
  );
}

function answers(company: CompanyType): string {
  const info = companyOf(company);
  let s = beginIntake(s1, info, tables);
  s = setBudget(setCustomers(setUsers(s, 120), 200_000), 150_000);
  return renderToStaticMarkup(createElement(IntakeAnswers, { tables, scenario: s, company, onCompany: noop, onEdit: noop }));
}

describe("step 1 (spec 15.1, 15.2, 15.3)", () => {
  let html: string;
  let rows: RegExpExecArray[];
  beforeAll(() => {
    html = questions();
    rows = [...html.matchAll(/<(button|a)\b[^>]*\bclass="choice[^"]*"[^>]*>(.*?)<\/\1>/g)];
  });

  it("lists six rows, the last a link to the contact address", () => {
    expect(rows).toHaveLength(6);
    const last = html.lastIndexOf('<a class="choice choice--provider"');
    expect(last).toBeGreaterThan(html.lastIndexOf('<button type="button" class="choice"'));
    expect(html).toContain('<a class="choice choice--provider" href="#contact">');
  });

  it("draws the compute seller like the others: one decorative icon, the label, the hint (spec 15.1)", () => {
    const provider = rows[5][2];
    expect(provider.match(/<svg/g)).toHaveLength(1);
    expect(provider).toContain('aria-hidden="true"');
    expect(provider).toContain('<span class="choice__label">I sell AI compute</span>');
    expect(provider).toContain('<span class="choice__hint">Cloud or GPU provider: talk to us about selling through InfraVana</span>');
    for (const row of rows) {
      expect(row[2].match(/<svg class="choice__icon"/g), row[2].slice(0, 80)).toHaveLength(1);
      expect(row[2]).toContain('width="28" height="28"');
    }
    expect(html).not.toContain("(cloud or GPU provider)");
  });

  it("reads 'Step 1' with the rule at 1 of 6, and has no estimate panel", () => {
    expect(html).toMatch(/Step 1<progress[^>]*value="1" max="6"/);
    expect(html).not.toContain("Step 1 of");
    expect(html).not.toContain("estimate");
    expect(html).not.toContain("Worked out from your answers");
  });
});

describe("the answer grid (spec 15.5)", () => {
  const labelsOf = (html: string) => [...html.matchAll(/<span id="[^"]*" class="answer__label">([^<]*)<\/span>/g)].map((m) => m[1]);

  it("six answers: Company, Team, Customers, Budget a quarter, Work, Answers needed", () => {
    expect(labelsOf(answers("software"))).toEqual(["Company", "Team", "Customers", "Budget a quarter", "Work", "Answers needed"]);
  });

  it("five answers: a type without team work leaves the Team cell out", () => {
    expect(labelsOf(answers("ai_first"))).toEqual(["Company", "Customers", "Budget a quarter", "Work", "Answers needed"]);
  });

  it("a type without customer work leaves the Customers cell out", () => {
    expect(labelsOf(answers("chip"))).toEqual(["Company", "Team", "Budget a quarter", "Work", "Answers needed"]);
  });

  it("a telecom's customers are called subscribers", () => {
    expect(labelsOf(answers("telecom"))).toContain("Subscribers");
  });

  it("every cell holds one control that is named by its label, and shows the value", () => {
    const html = answers("software");
    expect(html.match(/<select class="answer__value" aria-labelledby=/g)).toHaveLength(5);
    expect(html.match(/<button id="[^"]*" type="button" class="answer__value" popoverTarget="[^"]*" aria-labelledby="[^"]* [^"]*"/g)).toHaveLength(1);
    // The values the visitor gave are the selected options: 120 people, $150K, five kinds of work.
    expect(html).toContain('<option value="120" selected="">120 people</option>');
    expect(html).toContain('<option value="200000" selected="">200,000</option>');
    expect(html).toContain('<option value="150000" selected="">$150K</option>');
    expect(html).toContain(">5 kinds</button>");
    expect(html).toContain('<option value="interactive" selected="">instantly, like a chat</option>');
  });

  it("is a group named 'Your answers', and the first render is one column (the width is read after it)", () => {
    const html = answers("software");
    expect(html).toContain('role="group" aria-label="Your answers"');
    expect(html).toContain("grid-template-columns:repeat(1, minmax(0, 1fr))");
  });
});
