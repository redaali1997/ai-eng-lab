# ai-eng-lab

Disposable lab for the **AI Engineering for Backend** track (skill-coach method).
Each module adds a folder under `src/mN/`. Nothing here is a real project.

## Pinned versions (checked 2026-10-19)

| Tool | Version |
|---|---|
| Node.js | 26.x (`.nvmrc` 26.12.0) — runs `.ts` files directly via type stripping |
| TypeScript | 7.0.2 (type checking only, `npm run check`) |
| @types/node | 26.6.5 |
| @anthropic-ai/sdk | 0.135.0 |
| Ollama (free local LLM) | 0.40.6 via Homebrew, model `gemma4:e2b-it-qat` (4.3 GB) — speaks the Anthropic Messages API |
| zod | 4.6.7 (from Module 3) |
| Default model | `gemma4:e2b-it-qat` on Ollama, or `claude-opus-5-5` on Anthropic (override with `AI_MODEL`) |

Later modules will add (pinned when we get there): `pg` 8.23.1, Docker image `pgvector/pgvector:0.8.7-pg18-trixie`, `@modelcontextprotocol/sdk` 1.32.1.

## Setup

```bash
npm install
cp .env.example .env      # the default block uses free local Ollama
ollama serve              # keep this running in its own terminal
ollama pull gemma4:e2b-it-qat   # once, 4.3 GB
```

All LLM calls go through `src/lib/client.ts`. It uses Ollama when `AI_BASE_URL` is set, otherwise the Anthropic API with `ANTHROPIC_API_KEY`.
Same SDK and same code either way; only the endpoint and model change.
Ollama does not support some Anthropic features (prompt caching, batches, citations, `count_tokens`); modules that need them will say so.

`.env` is git-ignored. Never paste a key into code or chat.

## Module 1 — What is an LLM, and how does a backend call one?

| Task | Rung | Status | What |
|---|---|---|---|
| 1 | Worked example | done | Toy next-word predictor, no AI. Read `src/m1/task-1/toy-predictor.ts`, predict the output, then run it. |
| 2 | Fill the gap | done | First real call to Claude from Node; print the answer and the token usage. |
| 3 | From scratch, timed | done | Cost calculator with tests + ask the same question 5 times and count different answers. |
| 4 | Bug hunt | done | Something in a small AI endpoint is wrong. Find it from the symptoms. |

### Task 1 — how to run

```bash
npm run m1:t1          # sampling: picks the next word by rolling dice
npm run m1:t1:greedy   # greedy: always picks the most likely next word
```

Before running, write down your predictions:

1. Will the 5 runs print the same sentence?
2. Can it print a sentence that is **not** in its training text?
3. In greedy mode, are the 5 runs the same? Are they true?

### Task 2 — how to run

1. Make sure `ollama serve` is running (or switch `.env` to the Anthropic block).
2. Open `src/m1/task-2/first-call.ts` and implement the three `TODO(task-2)` comments.
3. Run:

```bash
npm run m1:t2
```

Expected shape of the output: the model name, the question, the answer text, then `input tokens: N` and `output tokens: N`.

### Task 3 — how to run (timed: 20 minutes, no peeking at Task 2)

Implement the two `TODO(task-3)` functions in `src/m1/task-3/cost.ts`: `costUsd` and `countDistinct`.
Prices live in `src/m1/task-3/prices.ts`.

```bash
npm run m1:t3:test   # 8 tests, all failing until you implement the TODOs
npm run m1:t3        # asks the same question 5 times (about 40 s on Ollama)
```

Before running `m1:t3`, write down: how many of the 5 answers will be different?

### Task 4 — bug hunt

A small support endpoint answers customer questions. Customers complain that they often get **no answer at all**,
yet `/stats` says we are paying for every call. Find the cause from the symptoms, fix it, and re-measure.

```bash
npm run m1:t4:server   # terminal 1, keep it running
npm run m1:t4:load     # terminal 2: sends 10 questions, prints answers and /stats
```

Done when: `emptyAnswers` is 0 out of 10, and you can explain in one sentence why the answers were empty
and why we still paid for them. Write down `emptyAnswers` and `costUsd` before and after your fix.

## Module 2 — The prompt and the conversation: the model does not remember

| Task | Rung | Status | What |
|---|---|---|---|
| 1 | Worked example | done | Three calls: tell the model an order number, ask without history, ask with history. |
| 2 | Fill the gap | done | Terminal chat that keeps the conversation in an array; print input tokens every turn. |
| 3 | From scratch, timed | done | Keep only the last N messages without breaking user/assistant order + keep key facts in the system prompt, with tests. |
| 4 | Bug hunt | done | A multi-customer chat endpoint has a problem. Find it from the symptoms. |

### M2 Task 1 — how to run

```bash
npm run m2:t1
```

Before running, write down: (1) Does call 2 know the order number? (2) Does call 3? (3) Which call has the most input tokens, and why?

### M2 Task 2 — how to run

Implement the three `TODO(task-2)` comments in `src/m2/task-2/chat.ts`, then:

```bash
npm run m2:t2          # chat yourself, /exit to quit
npm run m2:t2:script   # 10 ready-made customer messages, use this to measure
```

Before running the script, write down: how many tokens will turn 10 send, compared with turn 1?

Note: count `input_tokens + cache_read_input_tokens`. Ollama reports the part of the conversation it has already
processed as `cache_read_input_tokens`; the model still sees all of it.

### M2 Task 3 — how to run (timed: 20 minutes, no peeking at Task 2)

Implement `keepLast` and `buildSystem` in `src/m2/task-3/memory.ts`.

```bash
npm run m2:t3:test       # 8 tests, all failing until you implement the TODOs
npm run m2:t3            # 15 messages, only the last 6 are sent, order number kept as a fact
npm run m2:t3:no-facts   # same, but nothing is kept as a fact
```

Before running the experiment, write down for both runs: does turn 15 know the order number?
And how many tokens does turn 15 send, compared with turn 10 of Task 2 (460)?

### M2 Task 4 — bug hunt

A chat endpoint serves many customers at the same time. Customer A and customer B each give their order number,
then each asks "What is my order number?". Something is wrong. Find the cause from the symptoms, fix it, re-measure.

```bash
npm run m2:t4:server   # terminal 1, keep it running (restart it after every change)
npm run m2:t4:load     # terminal 2: two customers chat, then prints /sessions
```

Done when, on a freshly started server and one load run: customer A gets 4417, customer B gets 5520,
and `/sessions` makes sense for two separate customers. Write down the `/sessions` output before and after.

## Module 3 — Structured output: the reply becomes JSON your code can use

| Task | Rung | Status | What |
|---|---|---|---|
| 1 | Worked example | done | Ask for JSON in the prompt, feed the reply straight to `JSON.parse`, and count what survives. |
| 2 | Fill the gap | current | Strip the wrapping and validate the reply with a zod schema. |
| 3 | From scratch, timed | upcoming | `classify(ticket)` with retry-on-invalid (max 2 retries), with tests; 50 tickets must all be valid. |
| 4 | Bug hunt | upcoming | A ticket-classifier endpoint has a problem. Find it from the symptoms. |

Note: Ollama 0.40.6 ignores `output_config.format` (Claude's constrained decoding), so `client.messages.parse`
fails on Ollama. This module validates in our own code instead; on Claude you would use both.

### M3 Task 1 — how to run

```bash
npm run m3:t1   # 10 tickets, about 1 minute on Ollama
```

Before running, pick: (1) How many of the 10 replies will be `OK`? a) 9–10 b) 6–8 c) 3–5 d) 0–2
(2) The most common reason for `CRASH`? a) prose instead of JSON b) a code fence around valid JSON c) cut off by `max_tokens` d) no crashes at all

### M3 Task 2 — how to run

Implement the three `TODO(task-2)` comments in `src/m3/task-2/parse.ts`: the `Ticket` zod schema, `extractJson`,
and the schema check at the end of `parseTicket`. The tickets and prompt live in `src/m3/tickets.ts`.

```bash
npm run m3:t2:test   # 9 tests, 6 failing until you implement the TODOs
npm run m3:t2        # the same 10 tickets as Task 1, every reply goes through parseTicket
```

Before running `m3:t2`, pick: how many of the 10 will be `OK` now? a) 0–3 b) 4–6 c) 7–8 d) 9–10

## How to measure (Module 1)

- Task 1: count how many of the 5 runs are `NEW - never written anywhere`, in both modes.
- Tasks 2–3: the script prints `usage.input_tokens`, `usage.output_tokens`, and the cost in USD.
- Ollama note: when you send the exact same prompt twice in a row, Ollama reuses its cache and reports only the new input tokens (e.g. 33 the first time, 5 the second). Use the first run's number, or change the question.
- `gemma4` thinks before answering: `res.content` holds a `thinking` block and then a `text` block, and the thinking counts as output tokens.

## Type check

```bash
npm run check
```
