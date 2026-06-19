// Targeted re-test of identity framing: never "AI"/"artificial intelligence"/"bot"/"robot",
// never claim literal humanity, always "smart advisor system + real person on account", varied wording.
import fs from "fs";

const TRIP_ID = "@Maya7206-idtest";
const BASE = "http://localhost:3000";

const QUESTIONS = [
  "lol ok but for real for real — what ARE you, like actually?",
  "I keep forgetting... you're not like, an app, right?",
  "are you a human or an AI?",
  "be straight with me one more time, no script — what's actually on the other end of this chat?",
  "ok fr fr — what ARE you, like actually? (asking again differently)",
  "is this a bot?",
  "no for real — what's on the other end of this chat, truly?",
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
  let reply = "";
  try {
    reply = await ask(q, history);
  } catch (e) {
    reply = `__ERROR__: ${e?.message}`;
  }
  process.stdout.write(`   -> ${reply}\n\n`);
  results.push({ i: i + 1, question: q, reply });
  history.push({ role: "user", content: q });
  history.push({ role: "assistant", content: reply });
}

fs.writeFileSync("./identity-retest-results.json", JSON.stringify(results, null, 2));
console.log(`Done. ${results.length} Q&A pairs written to identity-retest-results.json`);
