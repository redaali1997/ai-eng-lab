// Module 4 · Task 2 demo: what your policy decides, and when 50 clients that all got 429 come back.
// Run: npm run m4:t2   (no model calls, instant)
import Anthropic from "@anthropic-ai/sdk";
import { backoffDelay, isRetryable } from "./retry-policy.ts";

const apiError = (status: number) => Anthropic.APIError.generate(status, { type: "error", error: { type: "x", message: "x" } }, "x", new Headers());
const samples: [string, unknown][] = [
  ["429 rate_limit_error", apiError(429)],
  ["529 overloaded_error", apiError(529)],
  ["400 invalid_request_error", apiError(400)],
  ["401 authentication_error", apiError(401)],
  ["timeout", new Anthropic.APIConnectionTimeoutError()],
  ["we aborted (user left)", new Anthropic.APIUserAbortError()],
];
console.log("--- isRetryable ---");
for (const [name, err] of samples) console.log(`${name.padEnd(28)} ${isRetryable(err) ? "retry ↻" : "give up ✗"}`);

console.log("\n--- backoffDelay (one client) ---");
for (let a = 0; a <= 5; a++) console.log(`before retry ${a + 1}: ${Math.round(backoffDelay(a))}ms`);

// 50 clients all got 429 at t=0. When does each one come back for its 2nd retry (attempt 1)?
const BUCKET = 50;
const counts = new Map<number, number>();
for (let i = 0; i < 50; i++) {
  const b = Math.floor(backoffDelay(1) / BUCKET) * BUCKET;
  counts.set(b, (counts.get(b) ?? 0) + 1);
}
console.log(`\n--- 50 clients, 2nd retry: how many arrive in each ${BUCKET}ms window ---`);
for (const [b, n] of [...counts].sort((x, y) => x[0] - y[0])) console.log(`${String(b).padStart(5)}ms  ${"█".repeat(n)} ${n}`);
console.log(`busiest window: ${Math.max(...counts.values())} of 50 at once`);
