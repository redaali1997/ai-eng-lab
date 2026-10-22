// Module 3 · Task 3: classify 50 tickets with retry-on-invalid and count valid results, retries and what they cost.
// Run: npm run m3:t3   (after npm run m3:t3:test passes). About 6–8 minutes on Ollama.
//      npm run m3:t3:chaos   same, but ~20% of FIRST replies are damaged on purpose ("high" -> "High"),
//                            so you can watch the retry path work against the real model.
import { client, model, backend } from "../../lib/client.ts";
import { costUsd } from "../../m1/task-3/cost.ts";
import { PRICES } from "../../m1/task-3/prices.ts";
import { classify, type CallModel } from "./classify.ts";
import { TICKETS_50 } from "./tickets50.ts";

const chaos = process.argv.includes("--chaos");
const limitArg = process.argv.find((a) => a.startsWith("--limit="));
const tickets = limitArg ? TICKETS_50.slice(0, Number(limitArg.split("=")[1])) : TICKETS_50;

const callModel: CallModel = async (messages) => {
  const res = await client.messages.create({ model, max_tokens: 1000, messages });
  let text = res.content.find((b) => b.type === "text")?.text ?? "";
  if (chaos && messages.length === 1 && Math.random() < 0.2) {
    text = text.replace(/"(low|medium|high)"/, (m) => m.toUpperCase());
    console.log("   (chaos: damaged the first reply)");
  }
  const input = res.usage.input_tokens + (res.usage.cache_read_input_tokens ?? 0);
  return { text, usage: { input_tokens: input, output_tokens: res.usage.output_tokens } };
};

console.log(`backend: ${backend}  model: ${model}${chaos ? "  CHAOS ON" : ""}\n`);
let valid = 0, retried = 0, extraCalls = 0;
const total = { input_tokens: 0, output_tokens: 0 };

for (const [i, ticket] of tickets.entries()) {
  const r = await classify(ticket, callModel);
  total.input_tokens += r.usage.input_tokens;
  total.output_tokens += r.usage.output_tokens;
  if (r.attempts > 1) { retried++; extraCalls += r.attempts - 1; }
  if (r.ok) valid++;
  const tag = r.ok ? "OK  " : "FAIL";
  console.log(`#${String(i + 1).padStart(2)} ${tag} attempts=${r.attempts} in=${r.usage.input_tokens}  ${r.ok ? JSON.stringify(r.data) : r.error}`);
}

const opus = costUsd(total, PRICES["claude-opus-5-5"]);
console.log(`\nvalid: ${valid}/${tickets.length}   tickets that needed a retry: ${retried}   extra calls: ${extraCalls}`);
console.log(`tokens: in ${total.input_tokens}, out ${total.output_tokens}   same run on claude-opus-5-5: $${opus.toFixed(4)}`);
