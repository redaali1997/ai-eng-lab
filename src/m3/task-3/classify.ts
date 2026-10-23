// Module 3 · Task 3 (from scratch, timed: 20 minutes): classify a ticket, and when the reply is invalid,
// send the model its own mistake and try again — at most MAX_RETRIES extra times.
import type Anthropic from "@anthropic-ai/sdk";
import type { Usage } from "../../m1/task-3/cost.ts";
import { PROMPT } from "../tickets.ts";
import { parseTicket, type Ticket } from "../task-2/parse.ts";

export const MAX_RETRIES = 2;

// One call to the model. Tests pass a fake one; run.ts passes the real one.
export type CallModel = (
  messages: Anthropic.MessageParam[],
) => Promise<{ text: string; usage: Usage }>;

export type ClassifyResult =
  | { ok: true; data: Ticket; attempts: number; usage: Usage }
  | { ok: false; error: string; attempts: number; usage: Usage };

// TODO(task-3): implement classify.
//   1. Start the conversation with one user message: PROMPT + ticket.
//   2. Call the model and check the reply with parseTicket (from Task 2).
//   3. Valid -> return ok: true with the data.
//   4. Invalid -> add the model's reply (as "assistant") and a "user" message that contains the parseTicket error
//      and asks for corrected JSON only, then call again.
//   5. Stop after 1 + MAX_RETRIES attempts in total -> return ok: false with the last error.
//   Always return how many attempts were made and the usage summed over ALL attempts (we pay for every one).
export async function classify(
  ticket: string,
  callModel: CallModel,
): Promise<ClassifyResult> {
  const history: Anthropic.MessageParam[] = [
    { role: "user", content: PROMPT + ticket },
  ];
  let result: ClassifyResult = {
    ok: false,
    attempts: 0,
    error: "",
    usage: { input_tokens: 0, output_tokens: 0 },
  };
  let inputTokens = 0;
  let outputTokens = 0;

  for (let index = 0; index < MAX_RETRIES + 1; index++) {
    const res = await callModel(history);

    const parsedText = parseTicket(res.text);

    inputTokens += res.usage.input_tokens;
    outputTokens += res.usage.output_tokens;

    if (!parsedText.ok) {
      history.push(
        { role: "assistant", content: res.text || "(empty reply)" },
        {
          role: "user",
          content: "Reply with corrected JSON only " + parsedText.error,
        },
      );

      result = {
        ok: false,
        attempts: index + 1,
        error: parsedText.error,
        usage: {
          input_tokens: inputTokens,
          output_tokens: outputTokens,
        },
      };
      continue;
    }

    result = {
      ok: true,
      data: parsedText.data,
      attempts: index + 1,
      usage: {
        input_tokens: inputTokens,
        output_tokens: outputTokens,
      },
    };
    break;
  }

  return result;
}
