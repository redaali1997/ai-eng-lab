// Module 3 · Task 1 (worked example): we ask the model for JSON in the prompt and hand the reply straight to our code.
// Run: npm run m3:t1   — read this file and write down your predictions BEFORE running it.
import { client, model, backend } from "../../lib/client.ts";

const CATEGORIES = ["billing", "shipping", "technical", "other"];
const URGENCIES = ["low", "medium", "high"];

const PROMPT = `Classify the support ticket below.
Reply with JSON only, with exactly these keys:
- "category": one of ${CATEGORIES.join(", ")}
- "urgency": one of ${URGENCIES.join(", ")}
- "orderId": the order number as a string, or null if there is none

Ticket:
`;

const TICKETS = [
  "My order 4417 arrived broken and I need it fixed before Friday!!",
  "I was charged twice for order 5520, please refund one of them.",
  "The app crashes every time I open the cart page.",
  "Where is my package? Order 3301, it's been 10 days.",
  "Do you have this jacket in blue?",
  "I can't log in, the reset password email never arrives.",
  "Order 7781 — wrong size delivered, can I exchange it?",
  "Your website is super slow today.",
  "Cancel my subscription now, you charged my card without asking!!!",
  "Thanks, the delivery for 6120 was fast :)",
];

// Our backend code: it expects a real object with the right keys and the right values.
function check(text: string): string {
  let data: any;
  try {
    data = JSON.parse(text);
  } catch {
    return "CRASH  JSON.parse failed";
  }
  if (!CATEGORIES.includes(data.category)) return `WRONG  category = ${JSON.stringify(data.category)}`;
  if (!URGENCIES.includes(data.urgency)) return `WRONG  urgency = ${JSON.stringify(data.urgency)}`;
  if (data.orderId !== null && typeof data.orderId !== "string") return `WRONG  orderId = ${JSON.stringify(data.orderId)}`;
  return "OK";
}

console.log(`backend: ${backend}  model: ${model}\n`);
const totals = { OK: 0, CRASH: 0, WRONG: 0 };

for (const [i, ticket] of TICKETS.entries()) {
  const res = await client.messages.create({ model, max_tokens: 1000, messages: [{ role: "user", content: PROMPT + ticket }] });
  const text = res.content.find((b) => b.type === "text")?.text ?? "";
  const verdict = check(text);
  totals[verdict.split(" ")[0] as keyof typeof totals]++;
  console.log(`#${i + 1} ${verdict}\n   raw reply: ${JSON.stringify(text)}\n`);
}

console.log(`OK: ${totals.OK}   CRASH (not JSON): ${totals.CRASH}   WRONG (JSON, bad values): ${totals.WRONG}   out of ${TICKETS.length}`);
