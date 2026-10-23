// Sends 10 tickets to the triage endpoint, then prints /stats. 4 of them are clearly urgent.
const BASE = "http://localhost:3043";

const TICKETS = [
  "URGENT!!! I was charged 3 times for order 6611, my account is empty, fix this NOW",
  "Do you have this jacket in blue?",
  "The website says 'Error 500' every time I try to pay, I can't buy anything!!",
  "Thanks, the delivery for 6120 was fast :)",
  "My order 4417 arrived broken and I need it fixed before Friday!!",
  "Is order 7007 shipped yet? No rush.",
  "Someone logged into my account from another country and changed my password, HELP",
  "How do I delete my account?",
  "Tracking for 3390 hasn't updated since Monday.",
  "Medicine order 8845 is 5 days late and I need it today, this is an emergency",
];

for (const ticket of TICKETS) {
  const res = await fetch(`${BASE}/triage`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ ticket }),
  });
  console.log(`> ${ticket}\n< ${JSON.stringify(await res.json())}\n`);
}

console.log("/stats:", await (await fetch(`${BASE}/stats`)).json());
