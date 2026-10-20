/**
 * The three examples offered as chips. Each loads a ready-made scenario file;
 * no language model is called.
 */
export interface Example {
  id: string;
  chip: string;
  /** Scenario file under the data folder to load through `loadScenario`. */
  scenarioId: string;
}

export const EXAMPLES: Example[] = [
  {
    id: "s1",
    chip: "50 people, $100K a quarter",
    scenarioId: "s1",
  },
  {
    id: "s2",
    chip: "Growing to 100 people, $200K a quarter",
    scenarioId: "s2",
  },
  {
    id: "hw",
    chip: "Chip-design team, $100K a quarter",
    scenarioId: "hardware_heavy",
  },
];
