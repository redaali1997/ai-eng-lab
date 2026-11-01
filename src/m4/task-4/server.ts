// Module 4 · Task 4 (bug hunt): the support chat backend. Every customer message goes through
// Task 3's resilientCall: primary model, retries, then a fallback, then a canned reply.
// Run: npm run m4:t4:api (terminal 1) · npm run m4:t4:server (terminal 2) · npm run m4:t4:load (terminal 3)
//
// POST /chat   { "message": "..." } -> { text, source }
// GET  /stats                       -> what customers got since the server started
import { createServer } from "node:http";
import { resilientCall, type ModelCall } from "../task-3/resilient.ts";
import { SUPPORT_MODEL, supportClient } from "./support-client.ts";

const PORT = 3044;
const RETRY = { maxRetries: 5, timeoutMs: 10_000 };
const stats = { customers: 0, primary: 0, fallback: 0, canned: 0, errors: 0 };

const askModel = (message: string): ModelCall => async (signal) => {
  try {
    const msg = await supportClient.messages.create(
      { model: SUPPORT_MODEL, max_tokens: 300, messages: [{ role: "user", content: message }] },
      { signal },
    );
    return msg.content.find((b) => b.type === "text")?.text ?? "";
  } catch (err) {
    // Add the customer's message so whoever is on call can find the conversation in the logs.
    console.error(`model call failed for "${message.slice(0, 40)}"`);
    throw err;
  }
};

// The fallback is a smaller, separate service; here it is "down" so we can see who reaches it.
const fallback: ModelCall = async () => {
  throw new Error("fallback model unavailable");
};

const server = createServer(async (req, res) => {
  const send = (status: number, body: unknown) => res.writeHead(status, { "content-type": "application/json" }).end(JSON.stringify(body));
  if (req.method === "GET" && req.url === "/stats") return send(200, stats);
  if (req.method === "POST" && req.url === "/chat") {
    let raw = "";
    for await (const chunk of req) raw += chunk;
    const { message } = JSON.parse(raw) as { message: string };
    stats.customers++;
    try {
      const r = await resilientCall(askModel(message), fallback, RETRY);
      
      stats[r.source]++;
      return send(200, { text: r.text, source: r.source, attempts: r.attempts });
    } catch (err) {
      stats.errors++;
      console.error(err);
      return send(500, { error: "something went wrong" });
    }
  }
  send(404, { error: "not found" });
});

server.listen(PORT, () => console.log(`support chat on http://localhost:${PORT}`));
