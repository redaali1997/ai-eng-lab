// Module 2 · Task 2 (fill the gap): a terminal chat that remembers the conversation.
// Run:  npm run m2:t2           -> you type, /exit to quit
//       npm run m2:t2:script    -> sends 10 ready-made customer messages (use this to measure)
import { createInterface } from "node:readline/promises";
import type Anthropic from "@anthropic-ai/sdk";
import { client, model, backend } from "../../lib/client.ts";

const SYSTEM =
  "You are a support agent for an online shop. Answer in at most two short sentences.";

const SCRIPT = [
  "Hi, my order number is 4417.",
  "I ordered a blue jacket, size M.",
  "When will it arrive?",
  "Can I change the size to L?",
  "What if L is out of stock?",
  "Do you have the jacket in black?",
  "How much is shipping to Alexandria?",
  "Can I pay cash on delivery?",
  "Thanks. Can you summarize my request?",
  "What is my order number again?",
];

// The whole conversation lives here. The API remembers nothing; this array is the memory.
const history: Anthropic.MessageParam[] = [];

async function turn(n: number, userText: string) {
  // TODO(task-2): add the customer's message to `history` (role "user").
  history.push({ role: "user", content: userText });

  // TODO(task-2): call client.messages.create with `model`, max_tokens: 1000, `system: SYSTEM`,
  //   and the WHOLE `history` as messages. Store the response in `res`.
  const res = await client.messages.create({
    model,
    max_tokens: 1000,
    system: SYSTEM,
    messages: history,
  });

  // TODO(task-2): find the text block in res.content, print it, and add it to `history` (role "assistant").
  //   Then print one line:
  //     turn <n> · messages sent: <history length before the reply> · tokens sent: <...> · output tokens: <...>
  //   tokens sent = res.usage.input_tokens + (res.usage.cache_read_input_tokens ?? 0)
  //   (Ollama skips re-reading the part of the conversation it has already seen and reports that part
  //    as cache_read_input_tokens. The model still sees all of it, so add both.)
  const text = res.content.find((c) => c.type === "text")?.text;
  console.log(text);

  if (text) {
    history.push({ role: "assistant", content: text });
  }

  const inputTokens =
    res.usage.input_tokens + (res.usage.cache_read_input_tokens ?? 0);
  console.log(
    `turn ${n} · messages sent: ${history.length - 1} · tokens sent: ${inputTokens} · output tokens: ${res.usage.output_tokens}`,
  );
}

console.log(`backend: ${backend}  model: ${model}\n`);

if (process.argv.includes("--script")) {
  for (const [i, text] of SCRIPT.entries()) {
    console.log(`you> ${text}`);
    await turn(i + 1, text);
  }
} else {
  const rl = createInterface({ input: process.stdin, output: process.stdout });
  for (let n = 1; ; n++) {
    const text = (await rl.question("you> ")).trim();
    if (text === "/exit") break;
    if (text) await turn(n, text);
  }
  rl.close();
}
