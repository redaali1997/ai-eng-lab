// Module 2 · Task 3 (from scratch, timed: 20 minutes, no peeking at Task 2).
// Make the tests pass: npm run m2:t3:test
// Then run the experiment: npm run m2:t3   and   npm run m2:t3:no-facts
import type Anthropic from "@anthropic-ai/sdk";

export type Message = Anthropic.MessageParam;

// TODO(task-3): return only the last `n` messages of `history`.
//   Rules:
//   - never change the `history` array you were given (return a new array)
//   - the result must start with a "user" message: if the cut starts with an "assistant" message, drop it
//   - n <= 0 returns an empty array
export function keepLast(history: Message[], n: number): Message[] {
  if (n <= 0) {
    return [];
  }

  if (n >= history.length) {
    return history.slice();
  }

  const lastNMessages = history.slice(history.length - n, history.length);
  if (lastNMessages.length && lastNMessages[0].role === "assistant") {
    lastNMessages.splice(0, 1);
  }

  return lastNMessages;
}

// TODO(task-3): build the system prompt from a fixed base text plus facts we must never forget.
//   - no facts: return `base` exactly as it is
//   - with facts: base, then an empty line, then "Known facts about this customer:",
//     then one line per fact in the form "- <key>: <value>", in the order they were added
//   Example: buildSystem("Be short.", { "order number": "4417" })
//     -> "Be short.\n\nKnown facts about this customer:\n- order number: 4417"
export function buildSystem(
  base: string,
  facts: Record<string, string>,
): string {
  if (Object.keys(facts).length <= 0) {
    return base;
  }

  let system = `${base}\n\nKnown facts about this customer:`;
  for (const key in facts) {
    system += `\n- ${key}: ${facts[key]}`;
  }

  return system;
}
