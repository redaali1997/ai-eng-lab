// Module 4 · Task 1 (worked example): the same reply, sent two ways.
// Run: npm run m4:t1:server   then open http://localhost:3041 or run: npm run m4:t1
//
// POST /reply/wait    { "message": "..." } -> JSON, sent once the whole reply is done
// POST /reply/stream  { "message": "..." } -> Server-Sent Events, sent piece by piece:
//   event: thinking   (once, when the model starts thinking, so the UI can show "thinking...")
//   event: text       data: {"text": "..."}               (every text_delta)
//   event: done       data: {"stop_reason": "...", "usage": {...}}
import { createServer, type ServerResponse } from "node:http";
import { readFileSync } from "node:fs";
import { backend, client, model } from "../../lib/client.ts";

const PORT = 3041;
const MAX_TOKENS = 1500;
const page = readFileSync(new URL("./index.html", import.meta.url), "utf8");

async function replyWait(message: string, res: ServerResponse) {
  const msg = await client.messages.create({ model, max_tokens: MAX_TOKENS, messages: [{ role: "user", content: message }] });
  const text = msg.content.find((b) => b.type === "text")?.text ?? "";
  res.writeHead(200, { "content-type": "application/json" });
  res.end(JSON.stringify({ text, stop_reason: msg.stop_reason, usage: msg.usage }));
}

async function replyStream(message: string, res: ServerResponse) {
  res.writeHead(200, { "content-type": "text/event-stream", "cache-control": "no-cache", connection: "keep-alive" });
  const sse = (event: string, data: unknown) => res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);

  const stream = client.messages.stream({ model, max_tokens: MAX_TOKENS, messages: [{ role: "user", content: message }] });
  // If the browser goes away, stop paying for tokens nobody will read.
  res.on("close", () => stream.abort());

  for await (const ev of stream) {
    if (ev.type === "content_block_start" && ev.content_block.type === "thinking") sse("thinking", {});
    if (ev.type === "content_block_delta" && ev.delta.type === "text_delta") sse("text", { text: ev.delta.text });
  }
  const final = await stream.finalMessage();
  sse("done", { stop_reason: final.stop_reason, usage: final.usage });
  res.end();
}

const server = createServer(async (req, res) => {
  try {
    if (req.method === "GET" && req.url === "/") {
      res.writeHead(200, { "content-type": "text/html; charset=utf-8" });
      return res.end(page);
    }
    if (req.method === "POST" && (req.url === "/reply/wait" || req.url === "/reply/stream")) {
      let raw = "";
      for await (const chunk of req) raw += chunk;
      const { message } = JSON.parse(raw) as { message?: string };
      if (!message) {
        res.writeHead(400, { "content-type": "application/json" });
        return res.end(JSON.stringify({ error: "body must be { message }" }));
      }
      console.log(`[${req.url}] ${message.slice(0, 50)}`);
      return req.url === "/reply/wait" ? await replyWait(message, res) : await replyStream(message, res);
    }
    res.writeHead(404).end();
  } catch (err) {
    console.error(err);
    if (!res.headersSent) res.writeHead(500, { "content-type": "application/json" });
    res.end(JSON.stringify({ error: String(err) }));
  }
});

server.listen(PORT, () => console.log(`m4 task 1 on http://localhost:${PORT} · ${backend} · ${model}`));
