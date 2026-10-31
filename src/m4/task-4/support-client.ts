// The model client the support chat uses. It points at the fake API from fake-api.ts.
import Anthropic from "@anthropic-ai/sdk";

export const supportClient = new Anthropic({
  baseURL: "http://localhost:3045",
  apiKey: "fake-key",
  maxRetries: 0, // resilientCall owns the retries (idea 5: never stack two retry layers)
});

export const SUPPORT_MODEL = "fake-model";
