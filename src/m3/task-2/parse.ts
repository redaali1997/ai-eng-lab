// Module 3 · Task 2 (fill the gap): turn the model's raw reply into a checked Ticket object, or say exactly why not.
import { z } from "zod";
import { CATEGORIES, URGENCIES } from "../tickets.ts";

// TODO(task-2): describe the reply with zod.
//   category: one of CATEGORIES, urgency: one of URGENCIES, orderId: a string or null.
export const Ticket = z.object({});

export type Ticket = z.infer<typeof Ticket>;

// TODO(task-2): return only the JSON part of the reply.
//   The model may wrap it in a code fence (```json ... ```) or put words before/after it.
//   Hint: the JSON object starts at the first "{" and ends at the last "}".
//   If there is no "{" ... "}" at all, return the text unchanged (JSON.parse will then fail with a clear error).
export function extractJson(text: string): string {
  return text;
}

export type ParseResult =
  | { ok: true; data: Ticket }
  | { ok: false; stage: "json" | "schema"; error: string };

export function parseTicket(text: string): ParseResult {
  let raw: unknown;
  try {
    raw = JSON.parse(extractJson(text));
  } catch (e) {
    return { ok: false, stage: "json", error: (e as Error).message };
  }

  // TODO(task-2): check `raw` against the Ticket schema without throwing.
  //   On success return { ok: true, data }. On failure return stage "schema" and a short error
  //   built from the zod issues, e.g. "urgency: Invalid option ...".
  return { ok: true, data: raw as Ticket };
}
