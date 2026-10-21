// Two customers chat at the same time, then each one asks for their order number.
const BASE = "http://localhost:3042";

async function say(customerId: string, message: string) {
  const res = await fetch(`${BASE}/chat`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ customerId, message }),
  });
  const { reply, error } = (await res.json()) as { reply?: string; error?: string };
  console.log(`${customerId} > ${message}\n${" ".repeat(customerId.length)} < ${error ? `ERROR ${error}` : reply || "<EMPTY>"}\n`);
}

await say("customer-A", "Hi, my order number is 4417.");
await say("customer-B", "Hello, my order number is 5520.");
await say("customer-A", "I ordered a blue jacket.");
await say("customer-B", "I ordered running shoes.");
await say("customer-A", "What is my order number?");
await say("customer-B", "What is my order number?");

console.log("/sessions:", await (await fetch(`${BASE}/sessions`)).json());
