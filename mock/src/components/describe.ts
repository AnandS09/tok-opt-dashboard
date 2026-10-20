import type { Scenario, Tables } from "../contract";
import { fmtShare, fmtUsd, hwLabel } from "../shared/format";
import {
  joinList,
  LATENCY_LABEL,
  STAGE_LABEL,
} from "./format";

/** One extracted value, as the "Understood" strip and the assumptions panel show it. */
export interface Understood {
  key: string;
  label: string;
  value: string;
  /** Names a `ScenarioResponse.missing` entry may use for this value. */
  aliases: string[];
}

function workloadLabel(tables: Tables, id: string): string {
  return tables.workloads.find((w) => w.workload_id === id)?.label ?? id;
}

export function understoodItems(scenario: Scenario, tables: Tables): Understood[] {
  const unit = scenario.unit === "people" ? "people" : "concurrent workflows";
  const items: Understood[] = [
    {
      key: "users",
      label: "Size",
      value: `${scenario.baseline.users.toLocaleString("en-US")} ${unit}`,
      aliases: ["users", "baseline.users", "baseline", "unit"],
    },
    {
      key: "budget",
      label: "Budget",
      value: `${fmtUsd(scenario.baseline.budget_usd_per_quarter)} per quarter`,
      aliases: ["budget", "budget_usd_per_quarter", "baseline.budget_usd_per_quarter", "baseline"],
    },
  ];
  if (scenario.target) {
    items.push({
      key: "target",
      label: "Growing to",
      value: `${scenario.target.users.toLocaleString("en-US")} ${unit}, ${fmtUsd(
        scenario.target.budget_usd_per_quarter,
      )} per quarter`,
      aliases: ["target"],
    });
  }
  items.push(
    {
      key: "workload_mix",
      label: "Work",
      value: Object.entries(scenario.workload_mix)
        .filter(([, share]) => share > 0)
        .map(([id, share]) => `${workloadLabel(tables, id).toLowerCase()} ${fmtShare(share)}`)
        .join(", "),
      aliases: ["workload_mix"],
    },
    {
      key: "model_mix",
      label: "Models",
      value: `frontier ${fmtShare(scenario.model_mix.frontier)}, mid ${fmtShare(
        scenario.model_mix.mid,
      )}, small ${fmtShare(scenario.model_mix.small)}; ${fmtShare(
        scenario.model_mix.open_weight_share,
      )} open-weight`,
      aliases: ["model_mix"],
    },
  );
  if (scenario.named_models.length > 0) {
    items.push({
      key: "named_models",
      label: "Models named",
      value: joinList(scenario.named_models),
      aliases: ["named_models"],
    });
  }
  items.push(
    {
      key: "stage_today",
      label: "Today",
      value: STAGE_LABEL[scenario.stage_today].toLowerCase(),
      aliases: ["stage_today"],
    },
    {
      key: "tiers_allowed",
      label: "Hardware",
      value:
        scenario.tiers_allowed === "all"
          ? "all tiers in the data"
          : joinList(scenario.tiers_allowed.map(hwLabel)),
      aliases: ["tiers_allowed"],
    },
    {
      key: "latency_class",
      label: "Latency",
      value: `answers ${LATENCY_LABEL[scenario.latency_class]}`,
      aliases: ["latency_class"],
    },
  );
  return items;
}

export function isAssumed(item: Understood, missing: string[]): boolean {
  return item.aliases.some((alias) => missing.includes(alias));
}
