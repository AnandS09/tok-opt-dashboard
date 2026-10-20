import type { ChartDef } from "../contract";
import { allocationChart } from "./c1Allocation";
import { costPerMtokChart } from "./c3CostPerMtok";
import { tokensBoughtChart } from "./c5TokensBought";

/**
 * The chart registry (spec 6). Each chart module adds its ChartDef here; the
 * album shell reads it. Array order is the album order (spec 4.1): C1, C5,
 * C3, then supporting charts.
 */
export const chartRegistry: ChartDef[] = [allocationChart, tokensBoughtChart, costPerMtokChart];
