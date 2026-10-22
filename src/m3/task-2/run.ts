// Module 3 · Task 2: the same 10 tickets as Task 1, but every reply goes through parseTicket.
// Run: npm run m3:t2   (after npm run m3:t2:test passes)
import { client, model, backend } from "../../lib/client.ts";
import { PROMPT, TICKETS } from "../tickets.ts";
import { parseTicket } from "./parse.ts";

console.log(`backend: ${backend}  model: ${model}\n`);
const totals = { ok: 0, json: 0, schema: 0 };

for (const [i, ticket] of TICKETS.entries()) {
  const res = await client.messages.create({ model, max_tokens: 1000, messages: [{ role: "user", content: PROMPT + ticket }] });
  const text = res.content.find((b) => b.type === "text")?.text ?? "";
  const r = parseTicket(text);
  if (r.ok) {
    totals.ok++;
    console.log(`#${i + 1} OK      ${JSON.stringify(r.data)}`);
  } else {
    totals[r.stage]++;
    console.log(`#${i + 1} FAIL(${r.stage})  ${r.error}\n   raw reply: ${JSON.stringify(text)}`);
  }
}

console.log(`\nOK: ${totals.ok}   FAIL json: ${totals.json}   FAIL schema: ${totals.schema}   out of ${TICKETS.length}`);
