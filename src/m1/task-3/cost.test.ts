import { test } from "node:test";
import assert from "node:assert/strict";
import { costUsd, countDistinct } from "./cost.ts";
import { PRICES } from "./prices.ts";

const opus = PRICES["claude-opus-5-5"];
const haiku = PRICES["claude-haiku-5-5"];
const close = (actual: number, expected: number) =>
  assert.ok(Math.abs(actual - expected) < 1e-9, `expected ${expected}, got ${actual}`);

test("the example from the module page: 20 in + 200 out on Opus = $0.00408", () => {
  close(costUsd({ input_tokens: 20, output_tokens: 200 }, opus), 0.00408);
});

test("zero tokens cost nothing", () => {
  close(costUsd({ input_tokens: 0, output_tokens: 0 }, opus), 0);
});

test("one million input tokens on Haiku = exactly the input price", () => {
  close(costUsd({ input_tokens: 1_000_000, output_tokens: 0 }, haiku), 0.1);
});

test("output tokens are 5x more expensive than input tokens on Opus", () => {
  const inputOnly = costUsd({ input_tokens: 1000, output_tokens: 0 }, opus);
  const outputOnly = costUsd({ input_tokens: 0, output_tokens: 1000 }, opus);
  close(outputOnly, inputOnly * 5);
});

test("your real Task 2 run: 34 in + 447 out on Opus", () => {
  close(costUsd({ input_tokens: 34, output_tokens: 447 }, opus), 0.009076);
});

test("countDistinct: same text with different case and spaces counts once", () => {
  assert.equal(countDistinct(["Three days.", "three days.", "  Three days.  "]), 1);
});

test("countDistinct: really different answers are counted", () => {
  assert.equal(countDistinct(["3 days", "7 days", "3 days", "5-10 days"]), 3);
});

test("countDistinct: empty list", () => {
  assert.equal(countDistinct([]), 0);
});
