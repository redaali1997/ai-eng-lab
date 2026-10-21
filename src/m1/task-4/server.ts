// Module 1 · Task 4 (bug hunt): a tiny support endpoint that answers customer questions.
// Run: npm run m1:t4:server   (keep it running)   then in another terminal: npm run m1:t4:load
//
// POST /ask   { "question": "..." }  -> { answer, usage, costUsd }
// GET  /stats                        -> totals since the server started
import { createServer } from "node:http";
import { client, model, backend } from "../../lib/client.ts";
import { costUsd } from "../task-3/cost.ts";
import { PRICES } from "../task-3/prices.ts";
import { PORT, LIMITS, BILLING_MODEL } from "./config.ts";

const stats = { calls: 0, emptyAnswers: 0, inputTokens: 0, outputTokens: 0, costUsd: 0 };

async function answer(question: string) {
  const res = await client.messages.create(
    {
      model,
      max_tokens: LIMITS.maxTokens,
      messages: [{ role: "user", content: `You are a support agent for an online shop. ${question}` }],
    },
    { timeout: LIMITS.timeoutMs },
  );
  const text = res.content.find((b) => b.type === "text")?.text.trim() ?? "";
  const cost = costUsd(res.usage, PRICES[BILLING_MODEL]);

  stats.calls++;
  if (text === "") stats.emptyAnswers++;
  stats.inputTokens += res.usage.input_tokens;
  stats.outputTokens += res.usage.output_tokens;
  stats.costUsd += cost;

  console.log(`[ask] in=${res.usage.input_tokens} out=${res.usage.output_tokens} chars=${text.length} cost=$${cost.toFixed(6)}`);
  return { answer: text, usage: res.usage, costUsd: cost };
}

const server = createServer(async (req, res) => {
  const send = (status: number, body: unknown) => {
    res.writeHead(status, { "content-type": "application/json" });
    res.end(JSON.stringify(body));
  };
  try {
    if (req.method === "GET" && req.url === "/stats") return send(200, stats);
    if (req.method === "POST" && req.url === "/ask") {
      let raw = "";
      for await (const chunk of req) raw += chunk;
      const { question } = JSON.parse(raw) as { question?: string };
      if (!question) return send(400, { error: "body must be { question: string }" });
      return send(200, await answer(question));
    }
    send(404, { error: "not found" });
  } catch (err) {
    console.error(err);
    send(500, { error: String(err) });
  }
});

server.listen(PORT, () => console.log(`support endpoint on http://localhost:${PORT}  (${backend}, ${model})`));
