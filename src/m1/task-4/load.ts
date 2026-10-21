// Sends 10 real-looking customer questions to the running endpoint, then prints /stats.
const BASE = "http://localhost:3041";
const questions = [
  "How long does a refund take?",
  "Can I change my delivery address after ordering?",
  "My package says delivered but I did not get it. What should I do?",
  "Do you ship to Alexandria?",
  "How do I return a pair of shoes that are too small?",
  "Can I pay cash on delivery?",
  "Why was my card charged twice?",
  "How do I cancel my order?",
  "Is there a warranty on headphones?",
  "Can I get an invoice for my company?",
];

for (const [i, question] of questions.entries()) {
  const res = await fetch(`${BASE}/ask`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ question }),
  });
  const body = (await res.json()) as { answer?: string; costUsd?: number; error?: string };
  const shown = body.error ? `ERROR ${body.error}` : body.answer ? body.answer.slice(0, 70) : "<EMPTY ANSWER>";
  console.log(`${String(i + 1).padStart(2)}. ${question}\n    -> ${shown}  ($${body.costUsd?.toFixed(6) ?? "?"})`);
}

console.log("\n/stats:", await (await fetch(`${BASE}/stats`)).json());
