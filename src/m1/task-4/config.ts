// Settings for the support-answer endpoint.
export const PORT = 3041;

export const LIMITS = {
  maxTokens: 1000,
  timeoutMs: 30_000,
};

// We report cost as "what this traffic would cost on Claude Opus".
export const BILLING_MODEL = "claude-opus-5-5";
