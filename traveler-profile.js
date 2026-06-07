// Persistent traveler profile — durable facts that must never be forgotten,
// regardless of how long the conversation grows (chat history is truncated, this is not).
import dotenv from "dotenv";
dotenv.config();
import OpenAI from "openai";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const EXTRACT_MODEL = "gpt-4o-mini";

const EMPTY_PROFILE = () => ({
  preferredName: null,        // e.g. "Bunny" — overrides legal name everywhere
  nationality: null,
  occasion: null,             // anniversary, honeymoon, solo reset, work trip...
  personalityTraits: [],      // introvert, adventurous, foodie, planner, spontaneous...
  likes: [],                  // things they responded positively to
  dislikes: [],               // things they explicitly rejected, with reason if known
  pace: null,                 // relaxed | balanced | packed
  notes: [],                  // free-form durable facts worth remembering
  updatedAt: null
});

// ── Cross-trip identity: email is the permanent key, tripId (the @handle) links to it ──
function ensureTravelersCollection(memoryDB) {
  if (!memoryDB.data) memoryDB.data = {};
  if (!memoryDB.data.travelers) memoryDB.data.travelers = [];
  return memoryDB.data.travelers;
}

const normEmail = (e) => String(e || "").trim().toLowerCase();

// Called when a CM provides their email (e.g. at itinerary download, or typed in chat).
// Links this tripId to that email and merges/carries forward their durable profile
// across trips — so "Sunny" stays "Sunny" and remembered preferences persist forever.
export async function linkEmailToTrip(memoryDB, email, tripId) {
  const key = normEmail(email);
  if (!key || !tripId) return null;

  const travelers = ensureTravelersCollection(memoryDB);
  let traveler = travelers.find(t => t.email === key);
  const convo = memoryDB.data.conversations?.find(c => c.tripId === tripId);
  const tripProfile = convo?.profile || EMPTY_PROFILE();

  if (!traveler) {
    traveler = { email: key, tripIds: [tripId], profile: tripProfile, updatedAt: new Date().toISOString() };
    travelers.push(traveler);
  } else {
    if (!traveler.tripIds.includes(tripId)) traveler.tripIds.push(tripId);
    // Merge: keep existing durable facts, fill gaps from this trip's profile
    traveler.profile = {
      preferredName: traveler.profile?.preferredName || tripProfile.preferredName,
      nationality: traveler.profile?.nationality || tripProfile.nationality,
      occasion: tripProfile.occasion || traveler.profile?.occasion,
      personalityTraits: mergeUnique(traveler.profile?.personalityTraits, tripProfile.personalityTraits),
      likes: mergeUnique(traveler.profile?.likes, tripProfile.likes),
      dislikes: mergeUnique(traveler.profile?.dislikes, tripProfile.dislikes),
      pace: traveler.profile?.pace || tripProfile.pace,
      notes: mergeUnique(traveler.profile?.notes, tripProfile.notes, 30),
      updatedAt: new Date().toISOString()
    };
    traveler.updatedAt = new Date().toISOString();
  }

  // Also stamp this trip's conversation with the email + a back-reference list of past trips,
  // so the agent knows "this is a returning traveler" without ever showing old transcripts.
  if (convo) {
    convo.travelerEmail = key;
    convo.profile = traveler.profile;
    convo.returningTraveler = traveler.tripIds.length > 1;
    convo.priorTripIds = traveler.tripIds.filter(id => id !== tripId);
  }

  await memoryDB.write();
  return traveler;
}

// Recognize a returning traveler by email OR by a previously-seen @tripId handle —
// used so a brand-new conversation can start "warm" instead of from zero.
export function recognizeTraveler(memoryDB, { email, tripId } = {}) {
  const travelers = ensureTravelersCollection(memoryDB);
  const key = normEmail(email);

  let traveler = key ? travelers.find(t => t.email === key) : null;
  if (!traveler && tripId) traveler = travelers.find(t => (t.tripIds || []).includes(tripId));

  if (!traveler) return null;
  return {
    email: traveler.email,
    profile: traveler.profile,
    isReturning: (traveler.tripIds || []).length > 1,
    priorTripCount: Math.max(0, (traveler.tripIds || []).length - 1)
  };
}

export function getDurableTravelerProfile(memoryDB, tripId) {
  const convo = memoryDB?.data?.conversations?.find(c => c.tripId === tripId);
  return (convo && convo.profile) ? convo.profile : EMPTY_PROFILE();
}

function mergeUnique(existing = [], incoming = [], max = 12) {
  const out = [...existing];
  for (const item of incoming) {
    if (!item) continue;
    const key = String(item).toLowerCase().trim();
    if (!out.some(o => String(o).toLowerCase().trim() === key)) out.push(item);
  }
  return out.slice(-max);
}

// Reads the user's message, pulls out durable facts, merges into the stored profile.
// Cheap, low-latency model call — only triggered on user messages.
export async function updateTravelerProfile(memoryDB, tripId, userMessage) {
  const text = String(userMessage || "").trim();
  if (!text) return getDurableTravelerProfile(memoryDB, tripId);

  const convo = memoryDB.data.conversations.find(c => c.tripId === tripId);
  if (!convo) return EMPTY_PROFILE();

  const current = convo.profile || EMPTY_PROFILE();

  let extracted = null;
  try {
    const completion = await openai.chat.completions.create({
      model: EXTRACT_MODEL,
      response_format: { type: "json_object" },
      temperature: 0,
      max_tokens: 250,
      messages: [
        {
          role: "system",
          content: `Extract DURABLE personal facts from a traveler's chat message — things a great human travel consultant would remember forever, not small talk.
Only return facts actually present in THIS message (do not guess). Use null/empty arrays where nothing new is found.
Return strict JSON: {"preferredName": string|null, "nationality": string|null, "occasion": string|null, "personalityTraits": string[], "likes": string[], "dislikes": string[], "pace": "relaxed"|"balanced"|"packed"|null, "notes": string[]}
Examples of durable facts: "call me Bunny" -> preferredName "Bunny"; "this is for our anniversary" -> occasion "anniversary"; "I don't like crowded places" -> dislikes ["crowded places"]; "I'm from Brazil" -> nationality "Brazil"; "I prefer slow mornings" -> pace "relaxed".`
        },
        { role: "user", content: text }
      ]
    });
    const raw = completion?.choices?.[0]?.message?.content;
    if (raw) extracted = JSON.parse(raw);
  } catch (e) {
    console.warn("Profile extraction failed:", e?.message);
    return current;
  }

  if (!extracted) return current;

  const merged = {
    preferredName: extracted.preferredName || current.preferredName,
    nationality: extracted.nationality || current.nationality,
    occasion: extracted.occasion || current.occasion,
    personalityTraits: mergeUnique(current.personalityTraits, extracted.personalityTraits),
    likes: mergeUnique(current.likes, extracted.likes),
    dislikes: mergeUnique(current.dislikes, extracted.dislikes),
    pace: extracted.pace || current.pace,
    notes: mergeUnique(current.notes, extracted.notes, 20),
    updatedAt: new Date().toISOString()
  };

  convo.profile = merged;
  await memoryDB.write();
  return merged;
}

// Renders the profile as a compact block injected into every chat system prompt,
// so durable facts survive no matter how long the conversation gets.
// Tells the agent (never the CM directly) that this is a returning traveler, so it can
// greet them like an old friend using only distilled facts — never a transcript dump.
export function formatReturningTravelerNote(recognition) {
  if (!recognition?.isReturning) return "";
  return `\nRETURNING TRAVELER: This person has planned ${recognition.priorTripCount} trip(s) with us before. Greet them like an old friend who genuinely remembers them — warm, a little familiar, referencing what you know about them naturally (their name, style, past occasion if relevant). NEVER say things like "according to our records" or reference "previous conversations/chat history" — just BE the consultant who already knows them.\n`;
}

export function formatProfileForPrompt(profile) {
  if (!profile) return "";
  const lines = [];
  if (profile.preferredName) lines.push(`- ALWAYS call them "${profile.preferredName}" (their preferred name — never use anything else)`);
  if (profile.nationality) lines.push(`- Nationality: ${profile.nationality}`);
  if (profile.occasion) lines.push(`- Occasion: ${profile.occasion} (weave this in naturally where relevant)`);
  if (profile.pace) lines.push(`- Preferred pace: ${profile.pace}`);
  if (profile.personalityTraits?.length) lines.push(`- Personality: ${profile.personalityTraits.join(", ")}`);
  if (profile.likes?.length) lines.push(`- Known likes: ${profile.likes.join(", ")}`);
  if (profile.dislikes?.length) lines.push(`- Known dislikes (never suggest these): ${profile.dislikes.join(", ")}`);
  if (profile.notes?.length) lines.push(`- Other remembered details: ${profile.notes.join("; ")}`);
  if (!lines.length) return "";
  return `\nTRAVELER PROFILE (remembered permanently — never contradict or forget these, even deep into the conversation):\n${lines.join("\n")}\n`;
}
