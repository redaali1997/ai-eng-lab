// Module 1 · Task 2 (fill the gap): your first real LLM call from a Node backend (local Ollama or Claude).
// Run: npm run m1:t2
import { client, model, backend } from "../../lib/client.ts";

const question =
  "In one short paragraph: how how long does a refund usually take for an online order?";

console.log(`backend:  ${backend}`);
console.log(`model:    ${model}`);
console.log(`question: ${question}\n`);

// TODO(task-2): send `question` to the model with client.messages.create(...).
//   - use `model` from above and max_tokens: 1000
//   - messages is an array with one item: { role: "user", content: question }
//   - store the response in a const called `res`

const res = await client.messages.create({
  model,
  max_tokens: 1000,
  messages: [{ role: "user", content: question }],
});

// TODO(task-2): print the answer text.
//   res.content is an array of blocks. Find the block whose type is "text" and print its .text
console.log(res.content.find(c => c.type === 'text')?.text);

// TODO(task-2): print the token usage, one line each:
//   input tokens:  res.usage.input_tokens
//   output tokens: res.usage.output_tokens
console.log("input tokens: " + res.usage.input_tokens);
console.log("output tokens: " + res.usage.output_tokens);
