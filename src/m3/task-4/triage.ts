// Turns a ticket into { category, urgency, orderId } with the model, and validates the reply.
import { z } from "zod";
import { client, model } from "../../lib/client.ts";
import { extractJson } from "../task-2/parse.ts";
import { URGENCY_LABELS, CATEGORY_LABELS } from "./labels.ts";

export const Triage = z.object({
  category: z.enum(["billing", "shipping", "technical", "other"]),
  urgency: z.enum(["low", "medium", "high"]),
  orderId: z.string().nullable(),
});
export type Triage = z.infer<typeof Triage>;

const PROMPT = `Classify the support ticket below.
Reply with JSON only, with exactly these keys:
- "category": one of ${CATEGORY_LABELS.join(", ").toLowerCase()}
- "urgency": one of ${URGENCY_LABELS.join(", ").toLowerCase()}
- "orderId": the order number as a string, or null if there is none

Ticket:
`;

export async function triage(ticket: string) {
  const res = await client.messages.create({ model, max_tokens: 1000, messages: [{ role: "user", content: PROMPT + ticket }] });
  const text = res.content.find((b) => b.type === "text")?.text ?? "";
  const usage = { input_tokens: res.usage.input_tokens + (res.usage.cache_read_input_tokens ?? 0), output_tokens: res.usage.output_tokens };

  let raw: unknown;
  try {
    raw = JSON.parse(extractJson(text));
  } catch {
    return { ok: false as const, usage };
  }
  const r = Triage.safeParse(raw);
  if (!r.success) return { ok: false as const, usage };
  return { ok: true as const, data: r.data, usage };
}
