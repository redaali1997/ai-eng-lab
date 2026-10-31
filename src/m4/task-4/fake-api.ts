// Module 4 · Task 4: a fake model API that speaks the Anthropic Messages API and has a rate limit,
// like a real provider. Ollama never answers 429, so we use this instead. It does not use any LLM.
// Run: npm run m4:t4:api   (keep it running)
//
// Rule: at most LIMIT requests are accepted in every 1-second window. Request number LIMIT+1 in the
// same second gets 429 rate_limit_error. Every request counts, accepted or not.
// GET /stats -> { received, accepted, rejected429 }   POST /reset -> zero the counters
import { createServer } from "node:http";

const PORT = 3045;
const LIMIT = 10;
const WORK_MS = 300; // how long a "model" takes to answer

let windowStart = Date.now();
let inWindow = 0;
const stats = { received: 0, accepted: 0, rejected429: 0 };

const server = createServer(async (req, res) => {
  if (req.method === "GET" && req.url === "/stats") return res.writeHead(200, { "content-type": "application/json" }).end(JSON.stringify(stats));
  if (req.method === "POST" && req.url === "/reset") {
    Object.assign(stats, { received: 0, accepted: 0, rejected429: 0 });
    return res.writeHead(204).end();
  }
  if (req.method !== "POST" || !req.url?.startsWith("/v1/messages")) return res.writeHead(404).end();
  for await (const _ of req); // drain the body

  const now = Date.now();
  if (now - windowStart >= 1000) {
    windowStart = now;
    inWindow = 0;
  }
  inWindow++;
  stats.received++;
  if (inWindow > LIMIT) {
    stats.rejected429++;
    return res
      .writeHead(429, { "content-type": "application/json" })
      .end(JSON.stringify({ type: "error", error: { type: "rate_limit_error", message: "Too many requests" } }));
  }
  stats.accepted++;
  await new Promise((r) => setTimeout(r, WORK_MS));
  res.writeHead(200, { "content-type": "application/json" }).end(
    JSON.stringify({
      id: `msg_${stats.accepted}`,
      type: "message",
      role: "assistant",
      model: "fake-model",
      content: [{ type: "text", text: "Your order is on its way and should arrive tomorrow." }],
      stop_reason: "end_turn",
      stop_sequence: null,
      usage: { input_tokens: 20, output_tokens: 12 },
    }),
  );
});

server.listen(PORT, () => console.log(`fake model API on http://localhost:${PORT} · ${LIMIT} requests per second`));
