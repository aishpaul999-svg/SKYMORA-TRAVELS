// Shared post-processing + anti-repetition helpers — used by every chat brain so the
// agent never leaks the openings/phrasings that immediately read as "scripted bot".

const BANNED_OPENINGS = [
  "I understand", "I see", "I hear you", "I get that", "I get it",
  "That's a great question", "Great question", "Absolutely", "Of course",
  "Let me help you", "I'd be happy to", "I totally get"
];

// Strips the stock openers and tidies punctuation/emoji spam. Pure text cleanup —
// does not call the model.
export function stripBannedOpenings(text) {
  let out = text;
  for (const phrase of BANNED_OPENINGS) {
    out = out.replace(new RegExp(`^${phrase}[,!.\\u2014-]?\\s*`, "i"), "");
  }
  out = out.replace(/!{2,}/g, "!").replace(/\.{3,}/g, "...");
  return out.trim();
}

// CRITICAL identity-disambiguation guard — prevents the model from confusing the
// AGENT's own name with the TRAVELER's nickname (a real bug found in stress-testing:
// "what's my nickname?" answered with the agent's own name). Inject this near the TOP
// of every system prompt, close to where the agent's identity is declared.
export function identityGuard(agentName, travelerNickname) {
  const agent = agentName || "your agent persona";
  const nick = travelerNickname || null;
  if (!nick) return "";
  return `\n⚠️ DO NOT CONFUSE THESE TWO NAMES — THEY ARE DIFFERENT PEOPLE:
- YOUR name (the agent / advisor): "${agent}"
- THE TRAVELER's nickname (the person you're talking to): "${nick}"
If asked "what's my nickname/name", the correct answer is "${nick}" — NEVER answer with "${agent}" (that is YOUR name, not theirs). Triple-check before answering any question about the traveler's own name/nickname.\n`;
}

// Cheap semantic-similarity check for near-paraphrase repeats (e.g. "best time for X?"
// then "just to double-check, best time for X again?"). Literal banned-phrase matching
// misses these — this catches shared significant-word overlap so the model can be told
// to genuinely vary its angle, not just its opening words.
export function findSimilarRecentQuestion(question, history = [], threshold = 0.55) {
  const norm = (s) => String(s || "").toLowerCase().replace(/[^\w\s]/g, " ").split(/\s+/).filter(w => w.length > 3);
  const qWords = new Set(norm(question));
  if (qWords.size < 2) return null;
  const userMsgs = (history || []).filter(m => m.role === "user" || m.role === "traveler").slice(0, -1);
  for (let i = userMsgs.length - 1; i >= 0; i--) {
    const pWords = norm(userMsgs[i].content);
    if (pWords.length < 2) continue;
    const overlap = pWords.filter(w => qWords.has(w)).length;
    const ratio = overlap / Math.min(qWords.size, pWords.length);
    if (ratio >= threshold) return userMsgs[i].content;
  }
  return null;
}

export function formatRepeatAngleNote(similarPriorQuestion) {
  if (!similarPriorQuestion) return "";
  return `\n🔁 NEAR-REPEAT DETECTED: They essentially just asked this moments ago ("${String(similarPriorQuestion).slice(0, 140)}"). Do NOT restate the same facts in similar words. Either (a) acknowledge you just covered it and add a genuinely NEW angle/detail you didn't mention, or (b) briefly note it's the same as before and ask what specifically they want more on. Never just rephrase the same answer.\n`;
}

// Builds a short "don't repeat yourself" block to inject into the system prompt,
// listing the agent's own recent replies so the model can consciously vary phrasing
// instead of recycling the same sentence shape for a question asked again.
export function formatRecentRepliesForPrompt(history = [], limit = 5) {
  const recentAgentLines = (history || [])
    .filter(m => m.role === "assistant" || m.role === "agent")
    .slice(-limit)
    .map(m => `- "${String(m.content || "").slice(0, 160)}"`)
    .join("\n");

  if (!recentAgentLines) return "";

  return `\nYOUR OWN RECENT REPLIES (do not reuse these openings/structures — if they're asking something similar again, reference that you covered it and add something new instead of recycling phrasing):\n${recentAgentLines}\n`;
}
