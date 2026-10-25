// Module 4 · Task 1: calls both endpoints with the same message and times them.
// Needs the server running: npm run m4:t1:server   then: npm run m4:t1
const BASE = "http://localhost:3041";
const message = "Reply to an angry customer whose order 4417 arrived broken. About 150 words.";
const body = JSON.stringify({ message });
const headers = { "content-type": "application/json" };

async function timeWait() {
  const t0 = performance.now();
  const r = (await (await fetch(`${BASE}/reply/wait`, { method: "POST", headers, body })).json()) as { text: string; stop_reason: string };
  const total = performance.now() - t0;
  return { firstAnything: total, firstWord: total, total, chars: r.text.length, stop: r.stop_reason };
}

async function timeStream() {
  const t0 = performance.now();
  let firstAnything = 0, firstWord = 0, chars = 0, stop = "";
  const res = await fetch(`${BASE}/reply/stream`, { method: "POST", headers, body });
  const decoder = new TextDecoder();
  let buf = "";
  for await (const chunk of res.body!) {
    if (!firstAnything) firstAnything = performance.now() - t0;
    buf += decoder.decode(chunk, { stream: true });
    const parts = buf.split("\n\n");
    buf = parts.pop()!;
    for (const part of parts) {
      const event = part.match(/^event: (.*)$/m)?.[1];
      const data = JSON.parse(part.match(/^data: (.*)$/m)?.[1] ?? "{}");
      if (event === "text") {
        if (!firstWord) firstWord = performance.now() - t0;
        chars += data.text.length;
        process.stdout.write(data.text);
      }
      if (event === "done") stop = data.stop_reason;
    }
  }
  process.stdout.write("\n");
  return { firstAnything, firstWord, total: performance.now() - t0, chars, stop };
}

const ROUNDS = 3;
const s = (ms: number) => `${(ms / 1000).toFixed(2)}s`;
const median = (xs: number[]) => [...xs].sort((a, b) => a - b)[Math.floor(xs.length / 2)];
type Timing = Awaited<ReturnType<typeof timeWait>>;
const print = (name: string, r: Timing) =>
  console.log(`${name.padEnd(14)} first anything ${s(r.firstAnything).padStart(7)} · first word ${s(r.firstWord).padStart(7)} · total ${s(r.total).padStart(7)} · ${r.chars} chars · ${r.stop}`);

// Warm-up: the first call after the model was idle also pays for loading it into memory.
console.log("warm-up call (not counted)...");
await timeWait();

const streams: Timing[] = [];
const waits: Timing[] = [];
for (let i = 1; i <= ROUNDS; i++) {
  console.log(`\n--- round ${i}: /reply/stream (words print as they arrive) ---\n`);
  streams.push(await timeStream());
  print(`stream #${i}`, streams.at(-1)!);
  waits.push(await timeWait());
  print(`wait   #${i}`, waits.at(-1)!);
}

const med = (rs: Timing[]): Timing => ({
  firstAnything: median(rs.map((r) => r.firstAnything)),
  firstWord: median(rs.map((r) => r.firstWord)),
  total: median(rs.map((r) => r.total)),
  chars: median(rs.map((r) => r.chars)),
  stop: rs.map((r) => r.stop).join(","),
});
console.log(`\n=== median of ${ROUNDS} rounds ===`);
print("stream", med(streams));
print("wait", med(waits));
