// Module 1 · Task 3 experiment: ask the same question 5 times.
// Prints each answer, its tokens, what it would cost on Claude, and how many answers were different.
import { client, model, backend } from "../../lib/client.ts";
import { costUsd, countDistinct } from "./cost.ts";
import { PRICES } from "./prices.ts";

const RUNS = 5;
const question = "Answer with one short sentence only: how many days does a refund take?";

console.log(`backend: ${backend}  model: ${model}`);
console.log(`question: ${question}\n`);

const answers: string[] = [];
let totalOpus = 0;

for (let run = 1; run <= RUNS; run++) {
  const started = Date.now();
  const res = await client.messages.create({
    model,
    max_tokens: 1000,
    messages: [{ role: "user", content: question }],
  });
  const text = res.content.find((b) => b.type === "text")?.text.trim() ?? "(no text block)";
  answers.push(text);

  const opus = costUsd(res.usage, PRICES["claude-opus-5-5"]);
  const haiku = costUsd(res.usage, PRICES["claude-haiku-5-5"]);
  totalOpus += opus;

  console.log(`run ${run} (${Date.now() - started} ms): ${text}`);
  console.log(
    `  tokens in/out: ${res.usage.input_tokens}/${res.usage.output_tokens}` +
      `   on Opus: $${opus.toFixed(6)}   on Haiku: $${haiku.toFixed(6)}`,
  );
}

console.log(`\ndifferent answers: ${countDistinct(answers)} / ${RUNS}`);
console.log(`total if these ${RUNS} calls ran on Opus: $${totalOpus.toFixed(6)}`);
