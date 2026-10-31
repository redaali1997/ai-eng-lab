// Module 4 · Task 3 demo on the real model. The primary is Ollama wrapped in "chaos": it answers 429
// about 40% of the time (Ollama itself never does). The fallback is the same model with a shorter answer.
// Run: npm run m4:t3          (primary flaky)
//      npm run m4:t3:down     (primary always 529, like 11 Dec 2024)
import { client, model, backend } from "../../lib/client.ts";
import { apiError } from "./fakes.ts";
import { resilientCall, type ModelCall } from "./resilient.ts";

const DOWN = process.argv.includes("--down");
const CHAOS = 0.4;
const QUESTIONS = [
  "Where is my order 4417?",
  "Can I change my delivery address?",
  "How do I get a refund for a broken item?",
  "Do you ship to Alexandria?",
  "My discount code does not work.",
  "How long does a replacement take?",
];

const ask = (question: string, maxTokens: number): ModelCall => async (signal) => {
  const msg = await client.messages.create(
    { model, max_tokens: maxTokens, system: "You are a support agent. Answer in one short sentence.", messages: [{ role: "user", content: question }] },
    { signal, maxRetries: 0 }, // our wrapper owns the retries (idea 5: never stack two retry layers)
  );
  return msg.content.find((b) => b.type === "text")?.text ?? "";
};

const primaryFor = (q: string): ModelCall => async (signal) => {
  if (DOWN) throw apiError(529);
  if (Math.random() < CHAOS) throw apiError(429);
  return ask(q, 1000)(signal);
};

console.log(`${backend} · ${model} · primary ${DOWN ? "DOWN (always 529)" : `flaky (${CHAOS * 100}% 429)`}\n`);
const count = { primary: 0, fallback: 0, canned: 0 };
let calls = 0;
const t0 = Date.now();
for (const q of QUESTIONS) {
  const t = Date.now();
  const r = await resilientCall(primaryFor(q), ask(q, 600), { maxRetries: 2, timeoutMs: 30_000 });
  count[r.source]++;
  calls += r.attempts;
  console.log(`[${r.source.padEnd(8)}] attempts ${r.attempts} · ${((Date.now() - t) / 1000).toFixed(1)}s · ${q}\n           ${r.text.slice(0, 110)}`);
}
console.log(`\nprimary ${count.primary} · fallback ${count.fallback} · canned ${count.canned} · errors shown to customers 0 · calls ${calls} · ${((Date.now() - t0) / 1000).toFixed(0)}s`);
