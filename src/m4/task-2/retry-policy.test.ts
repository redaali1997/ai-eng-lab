import { test } from "node:test";
import assert from "node:assert/strict";
import Anthropic from "@anthropic-ai/sdk";
import { backoffDelay, isRetryable } from "./retry-policy.ts";

const apiError = (status: number) => Anthropic.APIError.generate(status, { type: "error", error: { type: "x", message: "x" } }, "x", new Headers());

test("429 rate limit is retryable", () => assert.equal(isRetryable(apiError(429)), true));
test("529 overloaded and 500 are retryable", () => {
  assert.equal(isRetryable(apiError(529)), true);
  assert.equal(isRetryable(apiError(500)), true);
});
test("408 and 409 are retryable", () => {
  assert.equal(isRetryable(apiError(408)), true);
  assert.equal(isRetryable(apiError(409)), true);
});
test("400, 401, 403, 404, 422 are not retryable", () => {
  for (const s of [400, 401, 403, 404, 422]) assert.equal(isRetryable(apiError(s)), false, `status ${s}`);
});
test("a connection error and a timeout are retryable", () => {
  assert.equal(isRetryable(new Anthropic.APIConnectionError({ message: "socket hang up" })), true);
  assert.equal(isRetryable(new Anthropic.APIConnectionTimeoutError()), true);
});
test("a request we aborted ourselves is not retryable", () => {
  assert.equal(isRetryable(new Anthropic.APIUserAbortError()), false);
});
test("errors that are not from the API are not retryable", () => {
  assert.equal(isRetryable(new TypeError("cannot read properties of undefined")), false);
  assert.equal(isRetryable("boom"), false);
});

const noJitter = () => 0;
const fullJitter = () => 0.999999;
test("backoff doubles from 500ms", () => {
  assert.deepEqual([0, 1, 2, 3].map((a) => backoffDelay(a, noJitter)), [500, 1000, 2000, 4000]);
});
test("backoff never goes above 8000ms", () => {
  assert.equal(backoffDelay(4, noJitter), 8000);
  assert.equal(backoffDelay(10, noJitter), 8000);
});
test("jitter removes at most 25%", () => {
  assert.ok(Math.abs(backoffDelay(2, fullJitter) - 1500) < 1, "attempt 2 with max jitter ≈ 1500ms");
  for (let i = 0; i < 200; i++) {
    const d = backoffDelay(2);
    assert.ok(d > 1500 - 1 && d <= 2000, `attempt 2 delay ${d} must be in (1500, 2000]`);
  }
});
test("jitter actually spreads the delays", () => {
  const delays = new Set(Array.from({ length: 50 }, () => Math.round(backoffDelay(1))));
  assert.ok(delays.size > 10, `50 clients got only ${delays.size} different delays`);
});
