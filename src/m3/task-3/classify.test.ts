import { test } from "node:test";
import assert from "node:assert/strict";
import type Anthropic from "@anthropic-ai/sdk";
import { classify, MAX_RETRIES, type CallModel } from "./classify.ts";
import { PROMPT } from "../tickets.ts";

const GOOD = '{"category": "billing", "urgency": "high", "orderId": "5520"}';
const BAD_VALUE = '{"category": "billing", "urgency": "High", "orderId": "5520"}';
const PROSE = "This is a billing ticket.";

// A fake model: returns the given replies in order and records every request it received.
function fakeModel(replies: string[]) {
  const calls: Anthropic.MessageParam[][] = [];
  const call: CallModel = async (messages) => {
    calls.push(structuredClone(messages));
    const text = replies[Math.min(calls.length - 1, replies.length - 1)];
    return { text, usage: { input_tokens: 100 * calls.length, output_tokens: 10 } };
  };
  return { call, calls };
}

test("MAX_RETRIES is 2", () => {
  assert.equal(MAX_RETRIES, 2);
});

test("valid on the first try: one call, attempts 1", async () => {
  const m = fakeModel([GOOD]);
  const r = await classify("I was charged twice for order 5520", m.call);
  assert.equal(r.ok, true);
  assert.deepEqual(r.ok && r.data, { category: "billing", urgency: "high", orderId: "5520" });
  assert.equal(r.attempts, 1);
  assert.equal(m.calls.length, 1);
});

test("the first request is one user message: PROMPT + ticket", async () => {
  const m = fakeModel([GOOD]);
  await classify("Where is order 3301?", m.call);
  assert.deepEqual(m.calls[0], [{ role: "user", content: PROMPT + "Where is order 3301?" }]);
});

test("invalid then valid: the retry carries the bad reply and the error", async () => {
  const m = fakeModel([BAD_VALUE, GOOD]);
  const r = await classify("I was charged twice", m.call);
  assert.equal(r.ok, true);
  assert.equal(r.attempts, 2);
  const second = m.calls[1];
  assert.equal(second.length, 3);
  assert.deepEqual(second[1], { role: "assistant", content: BAD_VALUE });
  assert.equal(second[2].role, "user");
  assert.match(String(second[2].content), /urgency/);
});

test("prose reply is retried too", async () => {
  const m = fakeModel([PROSE, GOOD]);
  const r = await classify("I was charged twice", m.call);
  assert.equal(r.ok, true);
  assert.equal(r.attempts, 2);
});

test("an empty reply is retried, not crashed on", async () => {
  const m = fakeModel(["", GOOD]);
  const r = await classify("I was charged twice", m.call);
  assert.equal(r.ok, true);
  assert.equal(r.attempts, 2);
});

test("the third request has 5 messages (the whole conversation so far)", async () => {
  const m = fakeModel([PROSE, BAD_VALUE, GOOD]);
  const r = await classify("I was charged twice", m.call);
  assert.equal(r.ok, true);
  assert.equal(r.attempts, 3);
  assert.equal(m.calls[2].length, 5);
});

test("always invalid: gives up after 1 + MAX_RETRIES calls, never more", async () => {
  const m = fakeModel([BAD_VALUE]);
  const r = await classify("I was charged twice", m.call);
  assert.equal(r.ok, false);
  assert.equal(r.attempts, 1 + MAX_RETRIES);
  assert.equal(m.calls.length, 1 + MAX_RETRIES);
  assert.match(!r.ok ? r.error : "", /urgency/);
});

test("usage is summed over every attempt", async () => {
  const m = fakeModel([PROSE, BAD_VALUE, GOOD]);
  const r = await classify("I was charged twice", m.call);
  assert.deepEqual(r.usage, { input_tokens: 100 + 200 + 300, output_tokens: 30 });
});
