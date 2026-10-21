// In-memory conversation store: one history per customer.
import type { Message } from "../task-3/memory.ts";

const EMPTY: Message[] = [];
const sessions = new Map<string, Message[]>();

export function historyFor(customerId: string): Message[] {
  if (!sessions.has(customerId)) sessions.set(customerId, EMPTY);
  return sessions.get(customerId)!;
}

export function sessionSizes(): Record<string, number> {
  return Object.fromEntries([...sessions].map(([id, h]) => [id, h.length]));
}
