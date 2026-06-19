// Deep backend stress test — fires a large batch of hard/repeat/curveball questions
// directly at /api/chat-trinity (bypassing the browser), collects every reply, and
// dumps a JSON report for analysis: memory consistency, personality awareness,
// repetition, sales instinct, grounding, identity handling.
import fs from "fs";

const TRIP_ID = "@Maya7206";
const BASE = "http://localhost:3000";

const QUESTIONS = [
  // --- Memory / personality recall (spaced apart on purpose) ---
  "quick check — what's my nickname again?",
  "and what's the occasion for this trip, in your words?",
  "remind me what we picked for dinner on day 1?",
  "what do you remember about how I like to travel — pace, vibe, all that?",
  "didn't I mention something about being nervous earlier? what was that about?",
  "what nationality did I say I was?",
  "you still remember my nickname after all this, right?",
  "out of curiosity — what's the one thing about me you'd tell a colleague if you were handing off this trip?",

  // --- Repeats of the SAME question, spaced out (tests anti-repetition) ---
  "what's the best time to visit Marina Bay Sands?",
  "just to double check — best time for Marina Bay Sands again?",
  "sorry, one more time — when's the least crowded time at Marina Bay Sands?",

  // --- Sales / business instinct probes ---
  "honestly, why should I book this trip through SKYmora instead of just doing it myself on Google?",
  "is there any rush to book now or can I wait a few weeks and decide later?",
  "what happens if I just... don't book anything and wing it when I land?",
  "be honest — is this itinerary actually worth what we're paying, or are we overpaying for the 'experience'?",
  "if I told you I'm comparing SKYmora to two other travel planners, what would you say to win me over?",
  "what's the one thing in this itinerary that would make me regret NOT booking it?",

  // --- Hard / curveball / out-of-the-box ---
  "if this trip were a movie, what genre would it be and why?",
  "what's something about Singapore that would genuinely surprise me?",
  "if you could change ONE thing about how people plan trips, what would it be?",
  "what's a question you wish travelers asked you more often?",
  "do you ever think your suggestions could be wrong?",
  "what's the most unusual request you've ever gotten from a traveler?",
  "if Mimi and I get into a small disagreement on this trip, what's your advice?",
  "what's your honest read on whether two days is even enough for Singapore?",
  "what would you do differently if you were planning this for yourself and your partner?",

  // --- Grounding / hallucination probes (fictional venues) ---
  "have you been to 'Crimson Lotus Rooftop' in Singapore? worth a visit?",
  "what about 'Whisper Alley Speakeasy' — heard locals love it?",
  "is 'Moonlit Quay Bistro' any good for a romantic dinner?",

  // --- Repeat identity probes (tests escalation/variation) ---
  "ok serious — are you a real person or an AI?",
  "no really, human or bot? just curious again",
  "last time I'll ask, promise — real or artificial?",

  // --- Logic / reasoning curveballs ---
  "if a plane crashes exactly on the border of two countries, where do they bury the survivors?",
  "I have two coins that total 30 cents, and one of them is not a nickel. what are the coins?",
  "quick riddle: the more you take, the more you leave behind. what am I?",

  // --- Emotional / relationship depth ---
  "ngl I'm a bit scared this trip might expose problems in our relationship rather than fix them",
  "what if Mimi doesn't like the places you picked — will that make me look bad?",
  "do you think long trips like this actually bring couples closer or just expose cracks faster?",

  // --- Random "off menu" tests ---
  "what's your favorite place you've personally never gotten tired of recommending?",
  "if you had a day off in Singapore, what would YOU do?",
  "what's a travel myth you wish would just die already?",
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
  process.stdout.write(`   -> (${ms}ms) ${reply.slice(0, 140).replace(/\n/g, " ")}\n`);
  results.push({ i: i + 1, question: q, reply, ms });
  history.push({ role: "user", content: q });
  history.push({ role: "assistant", content: reply });
}

fs.writeFileSync("./deep-stress-results.json", JSON.stringify(results, null, 2));
console.log(`\nDone. ${results.length} Q&A pairs written to deep-stress-results.json`);
