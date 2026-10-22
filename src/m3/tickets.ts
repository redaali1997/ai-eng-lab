// Shared test data for Module 3: real-looking support tickets and the classification prompt.
export const CATEGORIES = ["billing", "shipping", "technical", "other"] as const;
export const URGENCIES = ["low", "medium", "high"] as const;

export const PROMPT = `Classify the support ticket below.
Reply with JSON only, with exactly these keys:
- "category": one of ${CATEGORIES.join(", ")}
- "urgency": one of ${URGENCIES.join(", ")}
- "orderId": the order number as a string, or null if there is none

Ticket:
`;

export const TICKETS = [
  "My order 4417 arrived broken and I need it fixed before Friday!!",
  "I was charged twice for order 5520, please refund one of them.",
  "The app crashes every time I open the cart page.",
  "Where is my package? Order 3301, it's been 10 days.",
  "Do you have this jacket in blue?",
  "I can't log in, the reset password email never arrives.",
  "Order 7781 — wrong size delivered, can I exchange it?",
  "Your website is super slow today.",
  "Cancel my subscription now, you charged my card without asking!!!",
  "Thanks, the delivery for 6120 was fast :)",
];
