// Module 2 · Task 4 (bug hunt): a chat endpoint that many customers use at the same time.
// Run: npm run m2:t4:server   (keep it running)   then in another terminal: npm run m2:t4:load
//
// POST /chat      { "customerId": "...", "message": "..." } -> { reply }
// GET  /sessions                                            -> messages stored per customer
import { createServer } from "node:http";
import { client, model, backend } from "../../lib/client.ts";
import { keepLast, buildSystem } from "../task-3/memory.ts";
import { historyFor, sessionSizes } from "./sessions.ts";

const PORT = 3042;
const KEEP = 10;
const BASE = "You are a support agent for an online shop. Answer in one short sentence.";

async function chat(customerId: string, message: string) {
  const history = historyFor(customerId);
  
  history.push({ role: "user", content: message });

  const res = await client.messages.create({
    model,
    max_tokens: 1000,
    system: buildSystem(BASE, {}),
    messages: keepLast(history, KEEP),
  });
  const reply = res.content.find((b) => b.type === "text")?.text.trim();
  if (reply) history.push({ role: "assistant", content: reply });

  console.log(`[chat] ${customerId} history=${history.length} tokens=${res.usage.input_tokens + (res.usage.cache_read_input_tokens ?? 0)}`);
  return { reply: reply ?? "" };
}

const server = createServer(async (req, res) => {
  const send = (status: number, body: unknown) => {
    res.writeHead(status, { "content-type": "application/json" });
    res.end(JSON.stringify(body));
  };
  try {
    if (req.method === "GET" && req.url === "/sessions") return send(200, sessionSizes());
    if (req.method === "POST" && req.url === "/chat") {
      let raw = "";
      for await (const chunk of req) raw += chunk;
      const { customerId, message } = JSON.parse(raw) as { customerId?: string; message?: string };
      if (!customerId || !message) return send(400, { error: "body must be { customerId, message }" });
      return send(200, await chat(customerId, message));
    }
    send(404, { error: "not found" });
  } catch (err) {
    console.error(err);
    send(500, { error: String(err) });
  }
});

server.listen(PORT, () => console.log(`chat endpoint on http://localhost:${PORT}  (${backend}, ${model})`));
