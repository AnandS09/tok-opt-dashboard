/**
 * The three example prompts offered in the locked prompt strip (spec 10
 * "Initial"). Prompts one and two are the prompts of the intent document. In
 * the mock they load a ready-made scenario file; no language model is called.
 */
export interface Example {
  id: string;
  chip: string;
  prompt: string;
  /** Scenario file under the data folder to load through `loadScenario`. */
  scenarioId: string;
}

export const EXAMPLES: Example[] = [
  {
    id: "s1",
    chip: "S1: allocate a budget",
    scenarioId: "s1",
    prompt:
      "I lead a company of 50 people and need to allocate a budget of $100K per quarter. My team runs a mix of software and hardware design workflows. Show me a good allocation strategy.",
  },
  {
    id: "s2",
    chip: "S2: scale up",
    scenarioId: "s2",
    prompt:
      "My company is now scaling from 50 to 100 people. Our workloads are Opus and Fable heavy. However, to keep our token budget tractable, we are deliberating on a strategy of using a mixture of open weight and proprietary models. We are planning to increase our spend from 100K a quarter to 200K a quarter. Please help me plan the allocation.",
  },
  {
    id: "hw",
    chip: "Hardware-design heavy",
    scenarioId: "hardware_heavy",
    prompt:
      "We are a 50-person chip design company with a budget of $100K per quarter. Most of our AI work, about 80 percent, is hardware design, with some software tooling. Show me how to spend it.",
  },
];
