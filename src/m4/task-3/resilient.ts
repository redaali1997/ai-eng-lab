// Module 4 · Task 3 (from scratch, timed: 20 minutes): one wrapper around any model call that
// retries, gives up on time, and falls back, so the customer always gets an answer.
// Tests: npm run m4:t3:test     Demo on Ollama: npm run m4:t3   /   npm run m4:t3:down
import { backoffDelay, isRetryable } from "../task-2/retry-policy.ts";

// A model call. It must stop and throw when `signal` aborts (the Anthropic SDK does this when you
// pass { signal }, and throws Anthropic.APIConnectionTimeoutError for a timeout).
export type ModelCall = (signal: AbortSignal) => Promise<string>;

export type Outcome = {
  text: string;
  source: "primary" | "fallback" | "canned";
  attempts: number; // every call made: primary attempts + the fallback call (if any)
};

export type Options = {
  maxRetries: number; // retries on the primary, after the first try
  timeoutMs: number; // per attempt
  sleep?: (ms: number) => Promise<void>; // injectable so tests do not really wait
};

export const CANNED_REPLY =
  "Thanks for your patience. Our assistant is busy right now; a person will reply within the hour.";

const realSleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

export async function resilientCall(
  primary: ModelCall,
  fallback: ModelCall,
  opts: Options,
): Promise<Outcome> {
  const sleep = opts.sleep ?? realSleep;
  // TODO(task-3): write the whole policy here.
  //   1. Call `primary` with a signal that aborts after opts.timeoutMs (AbortSignal.timeout).
  //   2. Success -> { source: "primary" }.
  //   3. A retryable error (task 2's isRetryable) -> sleep(backoffDelay(attempt)) and try again,
  //      at most opts.maxRetries retries.
  //   4. A NON-retryable error (400, 401...) is a bug in our request: rethrow it, do not hide it,
  //      and do not call the fallback.
  //   5. Retries used up -> call `fallback` ONCE (same timeout, no retries) -> { source: "fallback" }.
  //   6. Fallback fails too -> { text: CANNED_REPLY, source: "canned" }. Never throw here.
  //   `attempts` counts every call that was made.
  let attempts = 0;
  for (let attempt = 0; attempt <= opts.maxRetries; attempt++) {
    attempts++;
    try {
      const text = await primary(AbortSignal.timeout(opts.timeoutMs));
      return { source: "primary", text, attempts };
    } catch (e) {
      if (!isRetryable(e)) {
        throw e;
      }
      if (attempt < opts.maxRetries) {
        await sleep(backoffDelay(attempt));
      }
    }
  }

  try {
    attempts++;
    const text = await fallback(AbortSignal.timeout(opts.timeoutMs));
    return { source: "fallback", text, attempts };
  } catch (e) {
    return { source: "canned", text: CANNED_REPLY, attempts };
  }
}
