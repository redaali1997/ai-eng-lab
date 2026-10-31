import { test } from "node:test";
import assert from "node:assert/strict";
import { CANNED_REPLY, resilientCall } from "./resilient.ts";
import { scripted } from "./fakes.ts";

// Records every sleep instead of waiting.
function fakeSleep() {
  const waits: number[] = [];
  const sleep = async (ms: number) => void waits.push(ms);
  return { waits, sleep };
}
const opts = (sleep: (ms: number) => Promise<void>, maxRetries = 2, timeoutMs = 1000) => ({ maxRetries, timeoutMs, sleep });

test("primary works first time: no retry, no sleep, fallback untouched", async () => {
  const p = scripted([{ reply: "hi" }]);
  const f = scripted([{ reply: "backup" }]);
  const s = fakeSleep();
  assert.deepEqual(await resilientCall(p, f, opts(s.sleep)), { text: "hi", source: "primary", attempts: 1 });
  assert.equal(f.calls, 0);
  assert.deepEqual(s.waits, []);
});

test("429 twice then success: retried on the primary", async () => {
  const p = scripted([{ status: 429 }, { status: 429 }, { reply: "hi" }]);
  const f = scripted([{ reply: "backup" }]);
  const s = fakeSleep();
  const r = await resilientCall(p, f, opts(s.sleep));
  assert.deepEqual(r, { text: "hi", source: "primary", attempts: 3 });
  assert.equal(f.calls, 0);
  assert.equal(s.waits.length, 2);
});

test("the waits between retries come from backoffDelay (grow, with jitter)", async () => {
  const p = scripted([{ status: 529 }, { status: 529 }, { reply: "hi" }]);
  const s = fakeSleep();
  await resilientCall(p, scripted([{ reply: "b" }]), opts(s.sleep));
  assert.ok(s.waits[0] > 375 - 1 && s.waits[0] <= 500, `1st wait ${s.waits[0]} should be in (375, 500]`);
  assert.ok(s.waits[1] > 750 - 1 && s.waits[1] <= 1000, `2nd wait ${s.waits[1]} should be in (750, 1000]`);
});

test("primary down (529 forever): 1 + maxRetries tries, then the fallback once", async () => {
  const p = scripted([{ status: 529 }]);
  const f = scripted([{ reply: "backup" }]);
  const s = fakeSleep();
  assert.deepEqual(await resilientCall(p, f, opts(s.sleep)), { text: "backup", source: "fallback", attempts: 4 });
  assert.equal(p.calls, 3);
  assert.equal(f.calls, 1);
});

test("maxRetries 0: no retry at all, straight to the fallback", async () => {
  const p = scripted([{ status: 429 }]);
  const f = scripted([{ reply: "backup" }]);
  const s = fakeSleep();
  const r = await resilientCall(p, f, opts(s.sleep, 0));
  assert.equal(r.source, "fallback");
  assert.equal(p.calls, 1);
  assert.deepEqual(s.waits, []);
});

test("400 is our bug: rethrown, not retried, no fallback", async () => {
  const p = scripted([{ status: 400 }]);
  const f = scripted([{ reply: "backup" }]);
  const s = fakeSleep();
  await assert.rejects(resilientCall(p, f, opts(s.sleep)), (e: any) => e.status === 400);
  assert.equal(p.calls, 1);
  assert.equal(f.calls, 0);
});

test("a primary that hangs is cut off by the timeout and retried", async () => {
  const p = scripted(["hang", { reply: "hi" }]);
  const f = scripted([{ reply: "backup" }]);
  const s = fakeSleep();
  const t0 = Date.now();
  const r = await resilientCall(p, f, opts(s.sleep, 2, 50));
  assert.deepEqual(r, { text: "hi", source: "primary", attempts: 2 });
  assert.ok(Date.now() - t0 < 1000, "the timeout must cut the hanging call after ~50ms");
});

test("the fallback gets the timeout too, and only one try", async () => {
  const p = scripted([{ status: 529 }]);
  const f = scripted(["hang"]);
  const s = fakeSleep();
  const r = await resilientCall(p, f, opts(s.sleep, 1, 50));
  assert.deepEqual(r, { text: CANNED_REPLY, source: "canned", attempts: 3 });
  assert.equal(f.calls, 1);
});

test("both down: the customer gets the canned reply, nothing is thrown", async () => {
  const p = scripted([{ status: 529 }]);
  const f = scripted([{ status: 500 }]);
  const s = fakeSleep();
  assert.deepEqual(await resilientCall(p, f, opts(s.sleep)), { text: CANNED_REPLY, source: "canned", attempts: 4 });
});
