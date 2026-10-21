// USD per 1 million tokens, from the official Claude pricing table (checked 2026-10-19).
// Local Ollama is free, so we use these to answer: "what would this exact call cost on Claude?"
import type { Price } from "./cost.ts";

export const PRICES: Record<string, Price> = {
  "claude-opus-5-5": { inputPerMTok: 4, outputPerMTok: 20 },
  "claude-sonnet-5-5": { inputPerMTok: 2, outputPerMTok: 10 },
  "claude-haiku-5-5": { inputPerMTok: 0.1, outputPerMTok: 0.5 },
};
