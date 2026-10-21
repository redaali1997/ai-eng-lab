// Module 2 · Task 3 experiment: 15 customer messages, but we only send the last KEEP messages.
// With facts (default): the order number is saved as a fact and goes into the system prompt.
// With --no-facts: nothing is saved, so the first message is simply cut away.
import { client, model, backend } from "../../lib/client.ts";
import { keepLast, buildSystem, type Message } from "./memory.ts";

const KEEP = 6;
const BASE = "You are a support agent for an online shop. Answer in at most two short sentences.";
const useFacts = !process.argv.includes("--no-facts");

const SCRIPT = [
  "Hi, my order number is 4417.",
  "I ordered a blue jacket, size M.",
  "When will it arrive?",
  "Can I change the size to L?",
  "What if L is out of stock?",
  "Do you have the jacket in black?",
  "How much is shipping to Alexandria?",
  "Can I pay cash on delivery?",
  "Is there a warranty?",
  "Can I return it if I don't like the color?",
  "How long does a refund take?",
  "Do you have a store in Cairo?",
  "Can I get an invoice?",
  "Thanks for your help.",
  "What is my order number?",
];

const history: Message[] = []; // the full conversation, never cut
const facts: Record<string, string> = {};

console.log(`backend: ${backend}  model: ${model}  keep last ${KEEP} messages  facts: ${useFacts ? "on" : "off"}\n`);

for (const [i, userText] of SCRIPT.entries()) {
  history.push({ role: "user", content: userText });

  // Lab helper: pull the order number out of the customer's text.
  const found = userText.match(/order number is (\d+)/i);
  if (useFacts && found) facts["order number"] = found[1];

  const sent = keepLast(history, KEEP);
  const res = await client.messages.create({
    model,
    max_tokens: 1000,
    system: buildSystem(BASE, facts),
    messages: sent,
  });
  const text = res.content.find((b) => b.type === "text")?.text.trim();
  if (text) history.push({ role: "assistant", content: text });

  const tokens = res.usage.input_tokens + (res.usage.cache_read_input_tokens ?? 0);
  console.log(`turn ${String(i + 1).padStart(2)} · sent ${sent.length} msgs · tokens sent: ${tokens}`);
  if (i === 0 || i === SCRIPT.length - 1) console.log(`  you> ${userText}\n  bot> ${text ?? "(no text)"}`);
}
