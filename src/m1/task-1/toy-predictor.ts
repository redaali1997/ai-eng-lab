// Module 1 · Task 1 (worked example): a toy "language model" with no AI at all.
// It learns one thing from a tiny text: which word tends to come after which word.
// Then it writes sentences by guessing the next word, one word at a time.
// Real LLMs do the same job (predict the next piece) with billions of parameters instead of a word-count table.

const trainingText = `
the refund takes 3 days .
the delivery takes 7 days .
the refund needs a receipt .
the delivery needs an address .
your order is on the way .
your refund is on the way .
`;

const sentences = trainingText.trim().split("\n").map((s) => s.trim());
const words = sentences.flatMap((s) => s.split(" "));

// next[word] = how many times each word appeared right after `word`
const next = new Map<string, Map<string, number>>();
for (let i = 0; i < words.length - 1; i++) {
  const current = words[i];
  if (current === ".") continue; // a new sentence starts after "."
  const counts = next.get(current) ?? new Map<string, number>();
  counts.set(words[i + 1], (counts.get(words[i + 1]) ?? 0) + 1);
  next.set(current, counts);
}

function chances(word: string): [string, number][] {
  const counts = next.get(word);
  if (!counts) return [];
  const total = [...counts.values()].reduce((a, b) => a + b, 0);
  return [...counts.entries()].map(([w, c]) => [w, c / total]);
}

function pickNext(word: string, greedy: boolean): string {
  const options = chances(word);
  if (greedy) return options.reduce((best, o) => (o[1] > best[1] ? o : best))[0];
  let roll = Math.random();
  for (const [w, p] of options) {
    roll -= p;
    if (roll <= 0) return w;
  }
  return options[options.length - 1][0];
}

function complete(prompt: string, greedy: boolean): string {
  const out = prompt.split(" ");
  while (out[out.length - 1] !== "." && out.length < 12) {
    out.push(pickNext(out[out.length - 1], greedy));
  }
  return out.join(" ");
}

const greedy = process.argv.includes("--greedy");
const prompt = "the refund";

console.log(`What can come after "takes"?`);
for (const [w, p] of chances("takes")) console.log(`  ${w.padEnd(4)} ${(p * 100).toFixed(0)}%`);

console.log(`\nPrompt: "${prompt}"  mode: ${greedy ? "greedy (always the most likely word)" : "sampling (roll the dice)"}`);
for (let run = 1; run <= 5; run++) {
  const sentence = complete(prompt, greedy);
  const label = sentences.includes(sentence) ? "in the training text" : "NEW - never written anywhere";
  console.log(`  run ${run}: ${sentence.padEnd(34)} [${label}]`);
}
