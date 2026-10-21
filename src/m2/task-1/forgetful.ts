// Module 2 · Task 1 (worked example): does the model remember what you told it in the last call?
// Run: npm run m2:t1   — read this file and write down your predictions BEFORE running it.
import type Anthropic from "@anthropic-ai/sdk";
import { client, model, backend } from "../../lib/client.ts";

const SYSTEM = "You are a support agent for an online shop. Answer in one short sentence.";

async function ask(label: string, messages: Anthropic.MessageParam[]) {
  const res = await client.messages.create({ model, max_tokens: 1000, system: SYSTEM, messages });
  const text = res.content.find((b) => b.type === "text")?.text.trim() ?? "(no text block)";
  console.log(`${label}\n  sent ${messages.length} message(s), input tokens: ${res.usage.input_tokens}\n  -> ${text}\n`);
  return text;
}

console.log(`backend: ${backend}  model: ${model}\n`);

const first = { role: "user", content: "Hi, my order number is 4417. Please remember it." } as const;
const second = { role: "user", content: "What is my order number?" } as const;

// Call 1: tell the model the order number.
const reply1 = await ask("Call 1 — tell it the number", [first]);

// Call 2: a brand-new request that only contains the question.
await ask("Call 2 — ask again, sending ONLY the question", [second]);

// Call 3: the same question, but this time we send the whole conversation so far.
await ask("Call 3 — ask again, sending the WHOLE conversation", [
  first,
  { role: "assistant", content: reply1 },
  second,
]);
