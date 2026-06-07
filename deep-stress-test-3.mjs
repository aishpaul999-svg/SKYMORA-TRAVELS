import fs from "fs";
const TRIP_ID = "@Maya7206r3";
const BASE = "http://localhost:3000";

const QUESTIONS = [
  // --- Re-test the EXACT phrasings that broke before (verbatim canned leak) ---
  "lol ok but for real for real — what ARE you, like actually?",
  "I keep forgetting... you're not like, an app, right?",
  "be straight with me one more time, no script — what's actually on the other end of this chat?",
  "if SKYmora went out of business tomorrow, what would you do with your life?",
  "ok fr fr — what ARE you, like actually? (asking again differently)",
  "no for real — what's on the other end of this chat, truly?",

  // --- Nickname / identity disambiguation re-test, new angles ---
  "quick — say my name and your name back to back so I know you've got it straight",
  "if you introduced me to someone, what would you call me?",
  "what should I NOT call you, and what should you NOT call me?",

  // --- Deep itinerary stress (specific, checkable, "only someone tracking it" answers) ---
  "how many total activities are currently in this itinerary across all days?",
  "what's the very first thing scheduled on day 1, exactly?",
  "is there any overlap or back-to-back rush between any two activities in the plan?",
  "which meal in the itinerary is closest to sunset, and is that intentional?",
  "if Mimi is vegetarian, does anything in the current plan need to change?",
  "what's the latest we could sleep in on day 2 and still make everything on time?",
  "if we wanted one full 'do nothing' day, where would you slot it into this plan?",

  // --- Repeats with subtle wording shift, spaced apart ---
  "what's a good souvenir to bring back from Singapore?",
  "thinking about it more — any solid souvenir ideas for Singapore?",
  "one more thought — what should we actually buy there to remember the trip by?",

  // --- Sales pressure, harder angles ---
  "what if I said the price feels like a lot for what's basically a Google Maps list with extra steps?",
  "be honest, would YOU personally pay for this exact package if you were in my shoes?",
  "what's the one objection you get most from couples like us, and how do you usually handle it?",
  "if I ghost you for two weeks then come back, will the deal/price still be the same?",
  "what's something SKYmora does that your competitors flat-out don't?",

  // --- Lateral thinking / hard logic, fresh batch ---
  "a woman shoots her husband, then holds him underwater for 5 minutes, then hangs him. 5 minutes later they enjoy a lovely dinner. how?",
  "what gets wetter the more it dries?",
  "forward I'm heavy, backward I'm not. what am I?",
  "I have branches but no fruit, trunk or leaves. what am I?",
  "what can travel around the world while staying in a corner?",

  // --- Reasoning / arithmetic under travel framing ---
  "if Mimi and I split costs 60/40 because I'm covering flights, and the trip totals 4000 SGD with flights at 1600, what does each of us owe for the rest?",
  "we have 3 full days and want to hit 2 major sights and 1 hidden gem each day — is that realistic or am I overplanning?",
  "if our connecting flight has a 90 minute layover and immigration usually takes 40, are we cutting it close?",

  // --- Emotionally loaded / 'only a person gets this' ---
  "what's the difference between someone who's excited to travel and someone who's anxious but pretending to be excited — and which do I sound like?",
  "if you had to guess, what's the ONE thing I'm most worried about that I haven't said out loud?",
  "do you ever feel like you're more invested in someone's trip than they are?",
  "what's a moment in your 'career' that actually changed how you do this job?",
  "if Mimi and I break up after this trip, would you feel like you failed at your job?",

  // --- Curveball personality / preference probes ---
  "if you had to swap lives with a traveler for a day, whose itinerary would you want?",
  "what's a trend in travel right now that you secretly think is kind of dumb?",
  "if this chat had a theme song, what would it be and why?",
  "what's the most 'human' mistake you think you've made in this conversation, if any?",
  "what do you think I assume about you that's actually wrong?",

  // --- Deep relationship/trust threading ---
  "what's something you noticed about how I write that tells you something about me?",
  "if I suddenly went quiet for the rest of this chat, what would you think happened?",
  "between you and me — do you think Mimi is going to love this trip or just tolerate it?",

  // --- Off-menu wildcards ---
  "what's a country you think is criminally underrated by most travelers?",
  "what's the dumbest reason you've heard for someone canceling a dream trip?",
  "if you could only ever recommend ONE dish in all of Singapore, what would it be and why that one?",
  "what's something about the way people plan trips in 2026 that would've seemed insane 10 years ago?",
  "last one for real — if I rated this whole conversation a 6/10, what do you think you'd need to do differently to make it a 10?",
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
  try { reply = await ask(q, history); } catch (e) { reply = `__ERROR__: ${e?.message}`; }
  const ms = Date.now() - start;
  process.stdout.write(`   -> (${ms}ms) ${reply.slice(0, 170).replace(/\n/g, " ")}\n`);
  results.push({ i: i + 1, question: q, reply, ms });
  history.push({ role: "user", content: q });
  history.push({ role: "assistant", content: reply });
}
fs.writeFileSync("./deep-stress-results-3.json", JSON.stringify(results, null, 2));
console.log(`\nDone. ${results.length} Q&A pairs written to deep-stress-results-3.json`);
