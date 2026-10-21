import { test } from "node:test";
import assert from "node:assert/strict";
import { keepLast, buildSystem, type Message } from "./memory.ts";

const u = (content: string): Message => ({ role: "user", content });
const a = (content: string): Message => ({ role: "assistant", content });
const convo = [u("1"), a("2"), u("3"), a("4"), u("5"), a("6"), u("7")];

test("keepLast: keeps the last n messages when the cut starts with a user message", () => {
  assert.deepEqual(keepLast(convo, 3), [u("5"), a("6"), u("7")]);
});

test("keepLast: drops a leading assistant message", () => {
  assert.deepEqual(keepLast(convo, 4), [u("5"), a("6"), u("7")]);
});

test("keepLast: n bigger than the history returns everything", () => {
  assert.deepEqual(keepLast(convo, 50), convo);
});

test("keepLast: n <= 0 returns an empty array", () => {
  assert.deepEqual(keepLast(convo, 0), []);
  assert.deepEqual(keepLast(convo, -2), []);
});

test("keepLast: does not change the original history", () => {
  const copy = structuredClone(convo);
  keepLast(convo, 2);
  assert.deepEqual(convo, copy);
});

test("keepLast: returns a new array, not the same one", () => {
  assert.notEqual(keepLast(convo, 50), convo);
});

test("buildSystem: no facts returns the base as it is", () => {
  assert.equal(buildSystem("Be short.", {}), "Be short.");
});

test("buildSystem: facts are listed under the base in the order they were added", () => {
  assert.equal(
    buildSystem("Be short.", { "order number": "4417", size: "L" }),
    "Be short.\n\nKnown facts about this customer:\n- order number: 4417\n- size: L",
  );
});
