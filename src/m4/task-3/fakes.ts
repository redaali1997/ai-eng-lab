// Fake model calls for the Task 3 tests and the demo. Each step of a script is what ONE call does.
import Anthropic from "@anthropic-ai/sdk";
import type { ModelCall } from "./resilient.ts";

export type Step = { reply: string } | { status: number } | "hang";

export const apiError = (status: number) =>
  Anthropic.APIError.generate(status, { type: "error", error: { type: "x", message: `fake ${status}` } }, `fake ${status}`, new Headers());

// Waits until the signal aborts, then throws a timeout error, like the SDK does.
const hang = (signal: AbortSignal) =>
  new Promise<never>((_, reject) => {
    const fail = () => reject(new Anthropic.APIConnectionTimeoutError());
    if (signal.aborted) return fail();
    signal.addEventListener("abort", fail, { once: true });
  });

// Plays the script one step per call; the last step repeats forever. `calls` counts the calls.
export function scripted(steps: Step[]): ModelCall & { calls: number } {
  const fn = (async (signal: AbortSignal) => {
    const step = steps[Math.min(fn.calls, steps.length - 1)];
    fn.calls++;
    if (step === "hang") return hang(signal);
    if ("status" in step) throw apiError(step.status);
    return step.reply;
  }) as ModelCall & { calls: number };
  fn.calls = 0;
  return fn;
}
