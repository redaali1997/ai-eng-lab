import { test } from "node:test";
import assert from "node:assert/strict";
import { extractJson, parseTicket } from "./parse.ts";

const json = '{"category": "billing", "urgency": "high", "orderId": "5520"}';

test("extractJson: plain JSON stays as it is", () => {
  assert.equal(extractJson(json), json);
});

test("extractJson: removes a ```json code fence", () => {
  assert.equal(extractJson("```json\n" + json + "\n```"), json);
});

test("extractJson: removes words before and after", () => {
  assert.equal(extractJson(`Sure! Here it is:\n${json}\nHope this helps.`), json);
});

test("parseTicket: a valid fenced reply passes", () => {
  const r = parseTicket("```json\n" + json + "\n```");
  assert.deepEqual(r, { ok: true, data: { category: "billing", urgency: "high", orderId: "5520" } });
});

test("parseTicket: orderId null is allowed", () => {
  const r = parseTicket('{"category": "other", "urgency": "low", "orderId": null}');
  assert.equal(r.ok, true);
});

test("parseTicket: prose with no JSON fails at the json stage", () => {
  const r = parseTicket("This ticket is about billing.");
  assert.equal(r.ok, false);
  assert.equal(!r.ok && r.stage, "json");
});

test('parseTicket: "High" (capital H) fails at the schema stage and names the field', () => {
  const r = parseTicket('{"category": "billing", "urgency": "High", "orderId": null}');
  assert.equal(r.ok, false);
  assert.equal(!r.ok && r.stage, "schema");
  assert.match(!r.ok ? r.error : "", /urgency/);
});

test("parseTicket: a number orderId fails at the schema stage", () => {
  const r = parseTicket('{"category": "shipping", "urgency": "low", "orderId": 4417}');
  assert.equal(!r.ok && r.stage, "schema");
  assert.match(!r.ok ? r.error : "", /orderId/);
});

test("parseTicket: a missing key fails at the schema stage", () => {
  const r = parseTicket('{"category": "shipping", "urgency": "low"}');
  assert.equal(!r.ok && r.stage, "schema");
});
