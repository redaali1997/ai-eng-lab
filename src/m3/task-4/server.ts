// Module 3 · Task 4 (bug hunt): the support team's triage endpoint. "high" tickets page the on-call agent.
// Run: npm run m3:t4:server   (keep it running, restart it after every change)   then: npm run m3:t4:load
//
// POST /triage  { "ticket": "..." } -> { category, urgency, orderId, paged }
// GET  /stats                       -> counters since the server started
import { createServer } from "node:http";
import { backend, model } from "../../lib/client.ts";
import { costUsd } from "../../m1/task-3/cost.ts";
import { PRICES } from "../../m1/task-3/prices.ts";
import { triage } from "./triage.ts";

const PORT = 3043;
const stats = {
  triaged: 0,
  invalidReplies: 0,
  paged: 0,
  byUrgency: { low: 0, medium: 0, high: 0 } as Record<string, number>,
  byCategory: {} as Record<string, number>,
  usage: { input_tokens: 0, output_tokens: 0 },
};

function pageOnCall(ticket: string) {
  console.log(`[page] on-call agent paged: ${ticket.slice(0, 50)}`);
}

async function handle(ticket: string) {
  const r = await triage(ticket);
  stats.usage.input_tokens += r.usage.input_tokens;
  stats.usage.output_tokens += r.usage.output_tokens;
  if (!r.ok) {
    stats.invalidReplies++;
    return { error: "could not classify, sent to the manual queue" };
  }
  stats.triaged++;
  stats.byUrgency[r.data.urgency]++;
  stats.byCategory[r.data.category] = (stats.byCategory[r.data.category] ?? 0) + 1;
  const paged = r.data.urgency === "high";
  if (paged) {
    stats.paged++;
    pageOnCall(ticket);
  }
  console.log(`[triage] ${r.data.category}/${r.data.urgency} paged=${paged}`);
  return { ...r.data, paged };
}

const server = createServer(async (req, res) => {
  const send = (status: number, body: unknown) => {
    res.writeHead(status, { "content-type": "application/json" });
    res.end(JSON.stringify(body));
  };
  try {
    if (req.method === "GET" && req.url === "/stats") {
      return send(200, { ...stats, costUsdIfOpus: Number(costUsd(stats.usage, PRICES["claude-opus-5-5"]).toFixed(4)) });
    }
    if (req.method === "POST" && req.url === "/triage") {
      let raw = "";
      for await (const chunk of req) raw += chunk;
      const { ticket } = JSON.parse(raw) as { ticket?: string };
      if (!ticket) return send(400, { error: "body must be { ticket }" });
      return send(200, await handle(ticket));
    }
    send(404, { error: "not found" });
  } catch (err) {
    console.error(err);
    send(500, { error: String(err) });
  }
});

server.listen(PORT, () => console.log(`triage endpoint on http://localhost:${PORT}  (${backend}, ${model})`));
