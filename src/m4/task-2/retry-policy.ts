// Module 4 · Task 2 (fill the gap): the two decisions behind every retry.
//   1. isRetryable(err): could the SAME request succeed if we simply try again later?
//   2. backoffDelay(attempt): how long to wait before that next try?
// Tests: npm run m4:t2:test     Demo: npm run m4:t2
import Anthropic from "@anthropic-ai/sdk";

export const BASE_DELAY_MS = 500;
export const MAX_DELAY_MS = 8_000;
export const MAX_JITTER = 0.25; // remove up to 25% of the delay at random

// Error classes you will meet (all exported from "@anthropic-ai/sdk"):
//   Anthropic.APIError                   has .status (400, 401, 404, 408, 409, 429, 500, 529...)
//   Anthropic.APIConnectionError         network failure, .status is undefined
//   Anthropic.APIConnectionTimeoutError  a subclass of APIConnectionError, .status is undefined
//   Anthropic.APIUserAbortError          WE cancelled it (stream.abort()), .status is undefined too
export function isRetryable(err: unknown): boolean {
  // TODO(task-2): return true only for errors where trying the same request again can work:
  //   connection errors and timeouts, and API errors with status 408, 409, 429 or 5xx (529 included).
  //   Everything else is false: 400/401/403/404/422, a request we aborted ourselves, and errors
  //   that did not come from the API at all (a TypeError, a zod error...).

  if (err instanceof Anthropic.APIUserAbortError) {
    return false;
  }

  if (err instanceof Anthropic.APIConnectionError) {
    return true;
  }

  if (
    err instanceof Anthropic.APIError &&
    ([408, 409, 429].includes(err.status) || err.status >= 500)
  ) {
    return true;
  }

  return false;
}

// attempt 0 = the wait before the 1st retry, attempt 1 = before the 2nd retry, ...
// `random` is injectable so tests can pin it; in production it is Math.random.
export function backoffDelay(
  attempt: number,
  random: () => number = Math.random,
): number {
  // TODO(task-2): exponential backoff with jitter, in milliseconds:
  //   start at BASE_DELAY_MS and double it for every attempt, never above MAX_DELAY_MS,
  //   then remove a random part of it, up to MAX_JITTER (so the result is between 75% and 100%).

  let base = BASE_DELAY_MS * 2 ** attempt;

  if (base > MAX_DELAY_MS) {
    base = MAX_DELAY_MS;
  }

  return base * (1 - random() * MAX_JITTER);
}
