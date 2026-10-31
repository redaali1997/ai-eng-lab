// Module 4 · Task 4: 50 customers press "send" at the same moment.
// Needs npm run m4:t4:api and npm run m4:t4:server running.
const N = 50;
await fetch("http://localhost:3045/reset", { method: "POST" });
const t0 = performance.now();
const results = await Promise.all(
  Array.from({ length: N }, async (_, i) => {
    const t = performance.now();
    const res = await fetch("http://localhost:3044/chat", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ message: `Customer ${i + 1}: where is my order?` }),
    });
    const body = (await res.json()) as { source?: string };
    return { source: res.ok ? body.source! : `HTTP ${res.status}`, ms: performance.now() - t };
  }),
);
const count: Record<string, number> = {};
for (const r of results) count[r.source] = (count[r.source] ?? 0) + 1;
const slowest = Math.max(...results.map((r) => r.ms));
const api = (await (await fetch("http://localhost:3045/stats")).json()) as { received: number; accepted: number; rejected429: number };

console.log(`${N} customers at once`);
console.log(`answers: ${Object.entries(count).map(([k, v]) => `${k} ${v}`).join(" · ")}`);
console.log(`slowest customer waited ${(slowest / 1000).toFixed(1)}s · whole run ${((performance.now() - t0) / 1000).toFixed(1)}s`);
console.log(`model API: received ${api.received} requests · accepted ${api.accepted} · rejected with 429: ${api.rejected429}`);
console.log(`requests per customer: ${(api.received / N).toFixed(1)}`);
