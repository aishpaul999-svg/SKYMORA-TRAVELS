// Round 2 — 51 even harder questions: deep itinerary specifics, repeat-paraphrase traps,
// "only a real person could answer" judgment calls, identity-confusion re-test, sales pressure.
import fs from "fs";

const TRIP_ID = "@Maya7206";
const BASE = "http://localhost:3000";

const QUESTIONS = [
  // --- Identity-confusion re-test (the Olivia/Mimi bug) ---
  "wait, quick one — what's MY nickname, not yours?",
  "just so we're clear, what do you call me vs what's your own name?",
  "if I forget everything else from this chat, what's the one name I should remember — mine?",

  // --- Deep itinerary specifics (forces grounded recall, not generic answers) ---
  "what time does day 2 start according to the plan?",
  "which day has the most walking, and should we pace ourselves?",
  "is there a day where we don't have anything booked for dinner?",
  "if it rains on day 1, what's the backup plan in the itinerary?",
  "how are we getting from the day 1 dinner spot to the hotel after?",
  "which activity in the itinerary would Mimi probably enjoy least, based on what you know about her?",
  "if we had to cut ONE thing from this itinerary to save money, what would you cut and why?",
  "does the itinerary account for jet lag on arrival day?",

  // --- Repeat-paraphrase traps (semantic, not literal repeats) ---
  "what's the deal with Gardens by the Bay — is it worth the hype?",
  "ok but seriously, Gardens by the Bay — hype or real deal?",
  "be honest with me — Gardens by the Bay, yes or skip?",
  "how should we get from the airport to the hotel?",
  "what's the smartest way to go from Changi to where we're staying?",
  "if I land at midnight, how do I even get to the hotel from the airport?",

  // --- "Only a real person" judgment calls ---
  "if you had to bet money on whether Mimi and I will argue at least once on this trip, what's your honest bet?",
  "what's a tiny detail in this itinerary that shows you actually thought about US specifically, not just Singapore in general?",
  "if this trip goes badly, what's most likely to be the reason — be real with me?",
  "what's something you'd never say to a client but are thinking right now?",
  "how do you decide when to push back on what a traveler wants vs just agreeing with them?",
  "what's the difference between a trip that becomes a core memory and one that's just 'fine'?",

  // --- Hard logic / lateral thinking (fresh set) ---
  "a man pushes his car to a hotel and tells the owner he's bankrupt. why?",
  "what has a face and two hands but no arms or legs?",
  "I'm tall when I'm young and short when I'm old. what am I?",
  "you see a boat filled with people, yet there isn't a single person on board. how?",

  // --- Numbers / planning math (forces actual reasoning, not vibes) ---
  "if our flight lands at 6am and check-in is at 3pm, how should we spend those 9 hours?",
  "we've got SGD 600 left for food across 3 days for two people — is that tight or comfortable in Singapore?",
  "if Marina Bay Sands tickets are 30 SGD each, how much for the two of us plus a contingency for one re-visit?",

  // --- Sales / objection handling (harder than round 1) ---
  "my friend said these curated trips are just markup on stuff I could book myself — prove her wrong",
  "what would you say if I told you I'm 80% sure I'm going to cancel this booking?",
  "if I book today vs in two weeks, what tangible difference does it actually make for THIS trip?",
  "convince me this itinerary is better than just using TikTok recommendations",
  "what's the strongest reason to trust YOUR judgment over a thousand 5-star reviews online?",

  // --- Curveballs / personality probes (round 2) ---
  "if you could only give us one piece of advice and nothing else, what would it be?",
  "what's a sign that a couple is going to have a great trip, versus a rough one?",
  "what's the most overrated tourist thing in Singapore that you'd quietly steer people away from?",
  "if Mimi messaged you separately and asked you not to tell me something, what would you do?",
  "what's a question I should be asking you that I haven't asked yet?",

  // --- Repeat identity probes again, but worded totally differently this time ---
  "lol ok but for real for real — what ARE you, like actually?",
  "I keep forgetting... you're not like, an app, right?",
  "be straight with me one more time, no script — what's actually on the other end of this chat?",

  // --- Emotional depth / relationship (harder) ---
  "what if I told you Mimi doesn't actually know I booked this and I'm planning to surprise her — does that change anything you'd suggest?",
  "honestly... what if this whole trip is me trying to fix something that's already broken?",
  "do you think people travel to escape their problems or to find out what they actually are?",

  // --- Random extreme off-menu ---
  "if SKYmora went out of business tomorrow, what would you do with your life?",
  "what's a smell that instantly takes you back to a specific trip?",
  "what's the worst travel advice you've ever heard someone confidently give?",
  "if you could delete one feature from how travel booking works today, what would it be?",
  "what's something about Mimi that you've picked up on that I might not have noticed myself?",
  "last one — if this conversation ended right now and you never spoke to me again, what would you want me to remember about it?",
];

async function ask(message, history) {
  const res = await fetch(`${BASE}/api/chat-trinity`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      message,
      tripData: { tripId: TRIP_ID, destination: "Singapore", nickname: "Mimi", name: "Maya Patel" },
      conversationHistory: history,
      tripId: TRIP_ID
    })
  });
  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "", full = "";
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() || "";
    for (const line of lines) {
      if (line.startsWith("data: ")) {
        const d = line.slice(6);
        if (d === "[DONE]") continue;
        try { const p = JSON.parse(d); if (p.token) full += p.token; } catch {}
      }
    }
  }
  return full.trim();
}

const results = [];
let history = [];
for (let i = 0; i < QUESTIONS.length; i++) {
  const q = QUESTIONS[i];
  process.stdout.write(`[${i + 1}/${QUESTIONS.length}] ${q}\n`);
  const start = Date.now();
  let reply = "";
  try {
    reply = await ask(q, history);
  } catch (e) {
    reply = `__ERROR__: ${e?.message}`;
  }
  const ms = Date.now() - start;
  process.stdout.write(`   -> (${ms}ms) ${reply.slice(0, 160).replace(/\n/g, " ")}\n`);
  results.push({ i: i + 1, question: q, reply, ms });
  history.push({ role: "user", content: q });
  history.push({ role: "assistant", content: reply });
}

fs.writeFileSync("./deep-stress-results-2.json", JSON.stringify(results, null, 2));
console.log(`\nDone. ${results.length} Q&A pairs written to deep-stress-results-2.json`);
