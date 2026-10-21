// Module 1 · Task 3 (from scratch, timed: 20 minutes, no peeking at earlier tasks).
// Make the tests pass: npm run m1:t3:test
// Then run the experiment:  npm run m1:t3

export type Usage = { input_tokens: number; output_tokens: number };
export type Price = { inputPerMTok: number; outputPerMTok: number };

// TODO(task-3): return the cost of one call in USD.
//   Prices are per 1,000,000 tokens. Input and output have different prices.
export function costUsd(usage: Usage, price: Price): number {
  return (
    usage.input_tokens * (price.inputPerMTok / 1000000) +
    usage.output_tokens * (price.outputPerMTok / 1000000)
  );
}

// TODO(task-3): return how many different answers are in the list.
//   Two answers count as the same if they only differ in upper/lower case
//   or in spaces at the start/end.
export function countDistinct(answers: string[]): number {
  return new Set(answers.map((a) => a.trim().toLowerCase())).size;
}
