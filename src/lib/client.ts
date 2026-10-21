// Shared LLM client for every task in the lab.
// Two backends, same Anthropic SDK and same Messages API shape:
//   1. Local Ollama (free): set AI_BASE_URL=http://localhost:11434 and AI_MODEL=gemma4:e2b-it-qat
//   2. Anthropic (paid):    set ANTHROPIC_API_KEY and leave AI_BASE_URL empty
import Anthropic from "@anthropic-ai/sdk";

const baseURL = process.env.AI_BASE_URL || undefined;

if (!baseURL && !process.env.ANTHROPIC_API_KEY) {
  console.error("No LLM configured. Copy .env.example to .env (the Ollama block works for free).");
  process.exit(1);
}

// Ollama ignores the key, but the SDK requires one to be set.
export const client = baseURL ? new Anthropic({ baseURL, apiKey: "ollama" }) : new Anthropic();
export const model = process.env.AI_MODEL ?? (baseURL ? "gemma4:e2b-it-qat" : "claude-opus-5-5");
export const backend = baseURL ? `ollama (${baseURL})` : "anthropic";
