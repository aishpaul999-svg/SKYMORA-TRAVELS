// Conversational itinerary-editing engine — handles "I don't want that restaurant",
// "change this whole day", "different commute", "rebuild the trip" etc.
// Flow: detect intent -> pull real alternatives from the knowledge base -> explain
// ripple effects honestly -> ask for approval -> only then hand off to regeneration.
import dotenv from "dotenv";
dotenv.config();
import OpenAI from "openai";
import { loadDestination } from "./skymora-knowledge-engine.js";
import { formatProfileForPrompt } from "./traveler-profile.js";
import { AGENT_VOICE } from "./agent-voice.js";
import { formatRecentRepliesForPrompt } from "./response-quality.js";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const MODEL = "gpt-4o-mini";

// Step 1 — figure out whether this message is asking to change something in the itinerary,
// and if so, what kind of change (single venue, whole day, commute mode, full trip).
export async function detectItineraryChangeRequest(message, conversationHistory = []) {
  const recent = (conversationHistory || []).slice(-6).map(m => `${m.role}: ${m.content}`).join("\n");
  try {
    const completion = await openai.chat.completions.create({
      model: MODEL,
      response_format: { type: "json_object" },
      temperature: 0,
      max_tokens: 180,
      messages: [
        {
          role: "system",
          content: `Decide if the traveler's latest message is asking to CHANGE something about their itinerary (swap a restaurant/activity, change commute mode, redo a whole day, or rebuild the whole trip) — vs. just chatting/asking questions.
Return strict JSON: {"isChangeRequest": boolean, "scope": "venue"|"day"|"commute"|"full_trip"|null, "target": string|null, "reason": string|null}
- "target" = the specific thing they want changed (e.g. restaurant name, "Day 3", "the metro").
- "reason" = why, if they said it (e.g. "too crowded", "doesn't like seafood"). null if not stated.
Only set isChangeRequest true if they're clearly asking for something different — not just describing or asking about the current plan.`
        },
        { role: "user", content: `Recent conversation:\n${recent}\n\nLatest message: "${message}"` }
      ]
    });
    const raw = completion?.choices?.[0]?.message?.content;
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.warn("Change-intent detection failed:", e?.message);
  }
  return { isChangeRequest: false, scope: null, target: null, reason: null };
}

// Step 2 — pull real candidates from the knowledge base (not invented ones), scored
// for this traveler's persona, excluding whatever they're rejecting.
export function findAlternatives(destination, category, persona, excludeName = "", limit = 4) {
  const k = loadDestination(destination || "");
  if (!k) return [];

  const pool = category === "restaurant" ? (k.restaurants || [])
    : category === "activity" ? (k.activities || [])
    : [...(k.restaurants || []), ...(k.activities || [])];

  const excludeKey = String(excludeName || "").toLowerCase().trim();

  return pool
    .filter(v => v?.name && String(v.name).toLowerCase().trim() !== excludeKey)
    .filter(v => (v.scores?.[persona] || 0) >= 6)
    .sort((a, b) => (b.scores?.[persona] || 0) - (a.scores?.[persona] || 0))
    .slice(0, limit)
    .map(v => ({
      name: v.name,
      area: v.area,
      type: v.type || v.category,
      price: v.pricePerPerson || v.price,
      bestTime: v.bestTime,
      hours: v.hours,
      insider: v.insider || null,
      score: v.scores?.[persona] || 0
    }));
}

// Step 3 — compose the actual conversational reply: real options + honest reasoning
// (including what it means for the rest of the day) + an explicit approval question.
// We hand this to the LLM with strict grounding so it never invents venues — it can
// only phrase what we already pulled from the knowledge base.
export function buildChangeProposalConfig({
  message, tripData, conversationHistory, travelerProfile,
  changeIntel, alternatives, currentItem
}) {
  const profileBlock = formatProfileForPrompt(travelerProfile);

  const groundedOptions = alternatives.length
    ? alternatives.map((a, i) => `${i + 1}. ${a.name} (${a.area || "—"}) — ${a.type || ""} | ${a.price || ""}${a.bestTime ? ` | Best time: ${a.bestTime}` : ""}${a.insider ? `\n   Insider note: ${a.insider}` : ""}`).join("\n")
    : "No strong alternatives found in the knowledge base for this destination/category — be honest about that and offer to search more broadly or ask what they'd prefer instead.";

  const systemPrompt = `You are ${tripData?.agentData?.name || "Emma Collins"}, the traveler's personal SKYmora consultant.
${AGENT_VOICE}
${profileBlock}
THE TRAVELER WANTS TO CHANGE: ${changeIntel.target || "something in their itinerary"} (scope: ${changeIntel.scope || "unclear"})${changeIntel.reason ? `\nTheir stated reason: "${changeIntel.reason}"` : ""}
${currentItem ? `\nWHAT'S CURRENTLY PLANNED: ${currentItem.name}${currentItem.area ? ` in ${currentItem.area}` : ""}${currentItem.linkedTo ? ` — originally chosen because it's close to ${currentItem.linkedTo}` : ""}` : ""}

REAL OPTIONS FROM OUR DESTINATION INTELLIGENCE (ground every suggestion in these — never invent a venue):
${groundedOptions}
${formatRecentRepliesForPrompt(conversationHistory)}

HOW TO RESPOND (this is a real conversation, not a form):
1. Acknowledge what they said like a person would — briefly, naturally, no corporate tone.
2. Present 2-4 of the grounded options above. Don't just list them — explain WHY each one fits THIS traveler specifically (use their profile: personality, likes/dislikes, occasion, pace). Vary your phrasing; lead with your favorite if you have one and say so.
3. If swapping this thing creates a ripple effect (e.g. it was chosen for proximity to something else, it affects timing/commute/the rest of that day), say so honestly and plainly — e.g. "one thing to flag — this was picked because it's a 5 min walk from [X], so picking somewhere further might mean adjusting [Y] too." Don't hide trade-offs.
4. End by asking what they think / which direction they'd like to go — keep the door open for "show me more" or "none of these, what about...".
5. Do NOT say the itinerary has been changed. Nothing changes until they explicitly choose and approve — you're discussing options right now.
6. 3-6 sentences total unless the options genuinely need more room. Text like a sharp friend who happens to know this destination cold — never robotic, never a bullet-point form letter every time.`;

  const historyMessages = (conversationHistory || []).slice(-8).map(m => ({
    role: (m.role === "assistant" || m.role === "agent") ? "assistant" : "user",
    content: m.content
  }));

  return {
    model: MODEL,
    messages: [
      { role: "system", content: systemPrompt },
      ...historyMessages,
      { role: "user", content: message }
    ],
    stream: true,
    temperature: 0.85,
    max_tokens: 500,
    presence_penalty: 0.3,
    frequency_penalty: 0.3
  };
}

// Step 4 — once the traveler has clearly chosen + approved, classify the approved scope
// so the caller knows whether to patch one slot, one day, or trigger a full rebuild.
export async function classifyApprovedChangeScope(message, conversationHistory = []) {
  const recent = (conversationHistory || []).slice(-8).map(m => `${m.role}: ${m.content}`).join("\n");
  try {
    const completion = await openai.chat.completions.create({
      model: MODEL,
      response_format: { type: "json_object" },
      temperature: 0,
      max_tokens: 120,
      messages: [
        {
          role: "system",
          content: `Looking at this conversation, has the traveler clearly APPROVED a specific change to proceed (not just discussing options)?
Return strict JSON: {"approved": boolean, "scope": "single_slot"|"single_day"|"multi_day"|"full_trip"|null, "dayNumber": number|null, "summary": string|null}
"dayNumber" = which itinerary day this affects, if determinable (e.g. "Day 3" -> 3). null if unclear or it spans multiple/all days.
"summary" = one short sentence describing exactly what to change, for an internal log. null if not approved yet.`
        },
        { role: "user", content: `Conversation:\n${recent}\n\nLatest message: "${message}"` }
      ]
    });
    const raw = completion?.choices?.[0]?.message?.content;
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.warn("Approval-scope classification failed:", e?.message);
  }
  return { approved: false, scope: null, summary: null };
}
