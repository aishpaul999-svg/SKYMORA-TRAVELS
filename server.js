// ===============================
// SKYmora Travels — GOD-TIER BACKEND v4
// Real Google Data + Psychology Intelligence + World-Class Tone
// ===============================




import express from "express";
import cors from "cors";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
import OpenAI from "openai";
import { Low } from "lowdb";
import { JSONFile } from "lowdb/node";
import { v4 as uuidv4 } from "uuid";
import {
  handleIntelligentChat,
  detectIntent,
  handleIntentResponse,
  checkBudgetFeasibility,
  getEmotionResponse,
  buildContext,
  WORLD_KNOWLEDGE,
  MODEL
} from "./skymora-smart-chat.js";
import { setupPerfectChat, runPerfectProgrammatic } from "./skymora-perfect-chat.js";
import { DateTime } from "luxon";
import { needsLiveSearch, performLiveSearch, checkCurrentReality } from "./skymora-live-search.js";
import { runUltraProgrammatic, setupUltraChat } from "./skymora-ultra-chat.js";
import { classifyMessage } from "./skymora-firewall.js";
import { validateTrip, buildRejectionItinerary } from "./skymora-validator.js";
import { getDestinationPhoto } from "./skymora-photos.js";
import { MODES } from "./agent-system-lite.js";
import { holdDraft, cancelDraftTimer } from "./agent-draft-lite.js";
import { setupAgentRoutesLite } from "./agent-routes-lite.js";
import { buildKnowledgeBlock, loadDestination as loadDestinationKnowledge } from "./skymora-knowledge-engine.js";

/* ===============================
   SYSTEM PROMPT CACHE
=============================== */
const systemPromptCache = new Map();
function getCachedPrompt(tripId, builderFn) {
  if (!systemPromptCache.has(tripId)) {
    const prompt = builderFn();
    systemPromptCache.set(tripId, prompt);
    return prompt;
  }
  return systemPromptCache.get(tripId);
}

const itineraries = new Map();
dotenv.config();

console.log("🔑 OpenAI Key Loaded:", !!process.env.OPENAI_API_KEY);
console.log("🔑 Key Preview:", process.env.OPENAI_API_KEY?.slice(0, 15));
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// ======== SKYMORA GLOBAL INTELLIGENCE ========

const AIRPORT_DATABASE = {
  // INDIA
  "new delhi": "DEL", "delhi": "DEL", "indira gandhi": "DEL",
  "mumbai": "BOM", "bombay": "BOM", "bangalore": "BLR", "bengaluru": "BLR",
  "hyderabad": "HYD", "chennai": "MAA", "madras": "MAA",
  "kolkata": "CCU", "calcutta": "CCU", "pune": "PNQ", "ahmedabad": "AMD",
  "goa": "GOI", "kochi": "COK", "cochin": "COK", "jaipur": "JAI",
  "lucknow": "LKO", "amritsar": "ATQ", "chandigarh": "IXC",
  "bhubaneswar": "BBI", "nagpur": "NAG", "surat": "STV",
  "varanasi": "VNS", "agra": "AGR", "udaipur": "UDR",
  "dehradun": "DED", "shimla": "SLV", "leh": "IXL",
  // USA
  "new york": "JFK", "new york city": "JFK", "nyc": "JFK",
  "los angeles": "LAX", "la": "LAX", "chicago": "ORD", "miami": "MIA",
  "san francisco": "SFO", "boston": "BOS", "seattle": "SEA",
  "washington": "IAD", "washington dc": "IAD", "atlanta": "ATL",
  "dallas": "DFW", "houston": "IAH", "denver": "DEN", "phoenix": "PHX",
  "las vegas": "LAS", "orlando": "MCO", "honolulu": "HNL",
  // UK
  "london": "LHR", "manchester": "MAN", "edinburgh": "EDI",
  "birmingham": "BHX", "glasgow": "GLA",
  // EUROPE
  "paris": "CDG", "amsterdam": "AMS", "frankfurt": "FRA", "berlin": "BER",
  "madrid": "MAD", "barcelona": "BCN", "rome": "FCO", "milan": "MXP",
  "vienna": "VIE", "zurich": "ZRH", "geneva": "GVA", "brussels": "BRU",
  "lisbon": "LIS", "athens": "ATH", "prague": "PRG", "budapest": "BUD",
  "warsaw": "WAW", "stockholm": "ARN", "oslo": "OSL", "copenhagen": "CPH",
  "helsinki": "HEL", "dublin": "DUB", "munich": "MUC", "nice": "NCE",
  // MIDDLE EAST
  "dubai": "DXB", "abu dhabi": "AUH", "doha": "DOH", "riyadh": "RUH",
  "jeddah": "JED", "kuwait": "KWI", "muscat": "MCT", "beirut": "BEY",
  "istanbul": "IST", "amman": "AMM", "tel aviv": "TLV",
  // ASIA PACIFIC
  "singapore": "SIN", "bangkok": "BKK", "kuala lumpur": "KUL", "kl": "KUL",
  "jakarta": "CGK", "bali": "DPS", "denpasar": "DPS", "hong kong": "HKG",
  "tokyo": "NRT", "osaka": "KIX", "seoul": "ICN", "beijing": "PEK",
  "shanghai": "PVG", "guangzhou": "CAN", "taipei": "TPE",
  "new taipei": "TPE", "manila": "MNL", "hanoi": "HAN",
  "ho chi minh": "SGN", "saigon": "SGN", "phnom penh": "PNH",
  "yangon": "RGN", "colombo": "CMB", "kathmandu": "KTM",
  "dhaka": "DAC", "karachi": "KHI", "lahore": "LHE", "islamabad": "ISB",
  // AFRICA
  "cairo": "CAI", "nairobi": "NBO", "johannesburg": "JNB",
  "cape town": "CPT", "lagos": "LOS", "accra": "ACC", "ghana": "ACC",
  "casablanca": "CMN", "marrakech": "RAK", "tunis": "TUN",
  "addis ababa": "ADD", "dar es salaam": "DAR",
  // AMERICAS
  "toronto": "YYZ", "vancouver": "YVR", "montreal": "YUL",
  "mexico city": "MEX", "cancun": "CUN", "sao paulo": "GRU",
  "rio de janeiro": "GIG", "rio": "GIG", "buenos aires": "EZE",
  "lima": "LIM", "bogota": "BOG", "santiago": "SCL",
  // AUSTRALIA / NZ
  "sydney": "SYD", "melbourne": "MEL", "brisbane": "BNE",
  "perth": "PER", "auckland": "AKL", "christchurch": "CHC"
};

const DESTINATION_RESOLVER = {
  "france": "Paris", "england": "London", "uk": "London",
  "united kingdom": "London", "germany": "Berlin", "italy": "Rome",
  "spain": "Madrid", "usa": "New York", "america": "New York",
  "united states": "New York", "japan": "Tokyo", "china": "Beijing",
  "australia": "Sydney", "canada": "Toronto", "russia": "Moscow",
  "brazil": "Sao Paulo", "thailand": "Bangkok", "indonesia": "Bali",
  "malaysia": "Kuala Lumpur", "singapore": "Singapore", "uae": "Dubai",
  "egypt": "Cairo", "turkey": "Istanbul", "greece": "Athens",
  "portugal": "Lisbon", "netherlands": "Amsterdam", "switzerland": "Zurich",
  "austria": "Vienna", "belgium": "Brussels", "ireland": "Dublin",
  "scotland": "Edinburgh", "wales": "Cardiff", "sweden": "Stockholm",
  "norway": "Oslo", "denmark": "Copenhagen", "finland": "Helsinki",
  "poland": "Warsaw", "czechia": "Prague", "czech republic": "Prague",
  "hungary": "Budapest", "new zealand": "Auckland",
  "south africa": "Johannesburg", "kenya": "Nairobi", "morocco": "Marrakech",
  "sri lanka": "Colombo", "srilanka": "Colombo", "nepal": "Kathmandu",
  "maldives": "Malé", "seychelles": "Mahé", "vietnam": "Hanoi",
  "cambodia": "Phnom Penh", "philippines": "Manila", "taiwan": "Taipei",
  "south korea": "Seoul", "mexico": "Mexico City",
  "argentina": "Buenos Aires", "peru": "Lima", "colombia": "Bogota",
  "chile": "Santiago", "ghana": "Accra", "nigeria": "Lagos",
  "ethiopia": "Addis Ababa", "tanzania": "Dar es Salaam",
  "uganda": "Kampala", "rwanda": "Kigali", "zimbabwe": "Harare",
  "bangladesh": "Dhaka", "myanmar": "Yangon", "laos": "Vientiane",
  "jordan": "Amman", "israel": "Tel Aviv", "lebanon": "Beirut",
  "ukraine": "Kyiv", "romania": "Bucharest", "bulgaria": "Sofia",
  "croatia": "Zagreb", "serbia": "Belgrade", "iceland": "Reykjavik",
  "cuba": "Havana", "panama": "Panama City", "costa rica": "San Jose",
  "san diego": "San Diego", "sandieago": "San Diego", "san fransisco": "San Francisco",
  "los angeles": "Los Angeles", "new york": "New York City",
  "ecuador": "Quito", "bolivia": "La Paz", "venezuela": "Caracas"
};

// AI WORD BAN — words that make SKYmora sound generic
const AI_WORD_BAN = [
  "vibrant", "nestled", "charming", "unforgettable", "extraordinary",
  "delightful", "immersive", "enchanting", "magical", "breathtaking",
  "stunning", "incredible", "amazing", "wonderful", "fantastic",
  "world-class", "luxurious", "picturesque", "serene", "tranquil"
];

function resolveDestinationCity(destination) {
  if (!destination) return destination;
  const key = destination.toLowerCase().trim();
  return DESTINATION_RESOLVER[key] || destination;
}

function getAirportCode(cityName) {
  if (!cityName) return "???";
  const key = cityName.toLowerCase().trim();
  if (AIRPORT_DATABASE[key]) return AIRPORT_DATABASE[key];
  for (const [city, code] of Object.entries(AIRPORT_DATABASE)) {
    if (key.includes(city) || city.includes(key)) return code;
  }
  return cityName.substring(0, 3).toUpperCase();
}

function generateTripId(name) {
  const cleanName = (name || "Traveler").split(" ")[0];
  const capitalized = cleanName.charAt(0).toUpperCase() + cleanName.slice(1).toLowerCase();
  const randomNumber = Math.floor(1000 + Math.random() * 9000);
  return `@${capitalized}${randomNumber}`;
}

// ======== BACKUP SYSTEM ========
const dataDir = path.join(__dirname, "data");
if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });

const dbFile = path.join(dataDir, "backup.json");
const adapter = new JSONFile(dbFile);
const db = new Low(adapter, { logs: [] });
const memoryFile = path.join(dataDir, "memory.json");
const memoryAdapter = new JSONFile(memoryFile);
const memoryDB = new Low(memoryAdapter, { conversations: [] });

async function initDB() {
  await db.read();
  if (!db.data) db.data = { logs: [] };
  await memoryDB.read();
  if (!memoryDB.data) memoryDB.data = { trips: [], conversations: [] };
  if (!memoryDB.data.trips) memoryDB.data.trips = [];
  if (!memoryDB.data.conversations) memoryDB.data.conversations = [];
}
initDB();

async function saveBackup(entry) {
  const id = uuidv4();
  db.data.logs.push({ id, timestamp: new Date().toISOString(), ...entry });
  await db.write();
}

// ======== MEMORY SYSTEM ========
async function saveMemory(tripId, data) {
  if (!memoryDB.data) memoryDB.data = { trips: [], conversations: [] };
  const existing = memoryDB.data.trips.find(t => t.tripId === tripId);
  if (existing) {
    Object.assign(existing, data, { lastUpdated: new Date().toISOString() });
  } else {
    memoryDB.data.trips.push({
      tripId, ...data,
      createdAt: new Date().toISOString(),
      lastUpdated: new Date().toISOString(),
    });
  }
  await memoryDB.write();
}

function getMemory(tripId) {
  return memoryDB.data.trips.find(t => t.tripId === tripId) || null;
}

// ======== CHAT MEMORY ========
function getOrCreateConversation(tripId) {
  let convo = memoryDB.data.conversations.find(c => c.tripId === tripId);
  if (!convo) {
    convo = {
      tripId, paxName: tripId,
      mode: MODES.AUTO, priority: "normal", pendingDraft: null,
      status: "active", assignedAgent: null, messages: [],
      createdAt: new Date().toISOString(), lastUpdated: new Date().toISOString()
    };
    memoryDB.data.conversations.push(convo);
  }
  if (!convo.mode) convo.mode = MODES.AUTO;
  if (!convo.priority) convo.priority = "normal";
  if (!convo.pendingDraft) convo.pendingDraft = null;
  return convo;
}

async function saveChatMessage(tripId, role, content) {
  if (!memoryDB.data) memoryDB.data = { trips: [], conversations: [] };
  const convo = getOrCreateConversation(tripId);
  convo.messages.push({
    id: uuidv4(), role, content,
    timestamp: new Date().toISOString(), edited: false, seen: false
  });
  convo.lastUpdated = new Date().toISOString();
  await memoryDB.write();
}

function getChatHistory(tripId, limit = 20) {
  const convo = memoryDB.data.conversations.find(c => c.tripId === tripId);
  if (!convo) return [];
  return convo.messages.slice(-limit);
}

async function assignAgent(tripId, agentName) {
  const convo = getOrCreateConversation(tripId);
  convo.assignedAgent = agentName;
  convo.status = "assigned";
  await memoryDB.write();
}

async function agentReply(tripId, message) {
  await saveChatMessage(tripId, "agent", message);
}

// ======== GOOGLE LIVE SEARCH ENGINE ========
async function fetchRealTravelData(trip, day) {
  const {
    departure, destination, departureDate, returnDate,
    adults = 1, children = 0, infants = 0,
    budget = 0, currency = "USD",
    travelStyle = "", specialRequest = "", tripDays = 5
  } = trip;

  const totalPeople = Number(adults) + Number(children) + Number(infants);
  const dailyBudget = Math.round((Number(budget) || 0) / (Number(tripDays) || 1));
  const isDay1 = (day === 1);
  const isLastDay = (day === Number(tripDays));
  const hotelBudget = Math.round((Number(budget) || 0) * 0.35 / (Number(tripDays) || 1));
  const flightBudget = Math.round((Number(budget) || 0) * 0.30);

  const style = (travelStyle || "").toLowerCase();
  const req = (specialRequest || "").toLowerCase();
  let persona = "explorer";
  if (style.includes("luxury") || style.includes("elite")) persona = "luxury";
  else if (req.includes("honeymoon") || req.includes("romantic")) persona = "couple";
  else if (req.includes("photo") || req.includes("photography")) persona = "photographer";
  else if (req.includes("food") || req.includes("culinary")) persona = "foodie";
  else if (req.includes("adventure") || style.includes("adventure")) persona = "adventurer";
  else if (Number(children) > 0) persona = "family";
  else if (Number(adults) === 1) persona = "solo";

  const hotelStyle = persona === "luxury" ? "luxury 5 star" :
    persona === "family" ? "family friendly" :
    persona === "couple" ? "romantic boutique" : "best value";

  const diningStyle = persona === "luxury" ? "fine dining" :
    persona === "foodie" ? "authentic local street food" :
    persona === "family" ? "family friendly" : "local authentic";

  const activityStyle = persona === "photographer" ? "photography spots viewpoints" :
    persona === "adventurer" ? "outdoor adventure hiking" :
    persona === "luxury" ? "exclusive private tours" :
    persona === "family" ? "family activities kids" : "top attractions";

  const roomType = Number(children) > 0
    ? `family room ${adults} adults ${children} children`
    : Number(adults) > 1 ? "double room" : "single room";

  console.log(`🔍 Google search Day ${day} | Persona: ${persona} | Budget: ${currency}${dailyBudget}/day`);

  try {
    let searches = [];

    if (isDay1) {
      searches = [
        `flights from ${departure} to ${destination} ${departureDate} ${totalPeople} passenger price 2026`,
        `${hotelStyle} hotels ${destination} ${roomType} under $${hotelBudget} night 2026`,
        `best ${diningStyle} restaurants ${destination} price 2026`,
        `${activityStyle} ${destination} entry fee 2026`,
        `${destination} airport to city center transport price 2026`,
        ...(specialRequest ? [`${specialRequest} ${destination} 2026`] : [])
      ];
    } else if (isLastDay) {
      searches = [
        `${diningStyle} breakfast ${destination} 2026`,
        `${activityStyle} ${destination} half day 2026`,
        `${destination} airport transport options 2026`,
        ...(specialRequest ? [`${specialRequest} ${destination} 2026`] : [])
      ];
    } else {
      searches = [
        `${activityStyle} ${destination} day ${day} entry fee 2026`,
        `best ${diningStyle} restaurants ${destination} lunch dinner price 2026`,
        `local transport ${destination} price 2026`,
        ...(specialRequest ? [`${specialRequest} ${destination} 2026`] : [])
      ];
    }

    console.log(`🌐 Running ${searches.length} Google searches...`);
    const results = await Promise.all(searches.map(q => performLiveSearch(q)));

    const googleContext = searches.map((q, i) =>
      `=== GOOGLE: "${q}" ===\n${results[i]}\n`
    ).join("\n");

    console.log(`✅ Google data ready — ${searches.length} searches`);

    return {
      googleContext, dailyBudget, isDay1, isLastDay,
      persona, totalPeople, hotelBudget, flightBudget,
      travelStyle, specialRequest
    };

  } catch (err) {
    console.error("❌ Google search failed:", err.message);
    return null;
  }
}

// ======== REAL-TIME DATE ENGINE ========
async function getRealTimeData(query, tripData = {}) {
  const { departure, destination } = tripData;
  const msg = (query || "").toLowerCase().trim();
  let targetLocation = null;
  const cityMatch = msg.match(/(?:in|at)\s+([a-zA-Z\s]+)/i);
  if (cityMatch) targetLocation = cityMatch[1].trim();
  else if (/time|date|now|today|tomorrow/.test(msg)) targetLocation = departure || destination || "UTC";
  if (!targetLocation) return { askUser: true, message: "Which city would you like the time or date for?" };

  const cityTimeZones = {
    delhi: "Asia/Kolkata", mumbai: "Asia/Kolkata", dubai: "Asia/Dubai",
    london: "Europe/London", paris: "Europe/Paris", newyork: "America/New_York",
    newyorkcity: "America/New_York", sydney: "Australia/Sydney", tokyo: "Asia/Tokyo",
    toronto: "America/Toronto", losangeles: "America/Los_Angeles",
    singapore: "Asia/Singapore", bangkok: "Asia/Bangkok", rome: "Europe/Rome",
    goa: "Asia/Kolkata"
  };

  const timezone = cityTimeZones[targetLocation.replace(/\s+/g, "").toLowerCase()] || "UTC";
  const now = DateTime.now().setZone(timezone);

  if (/time/.test(msg)) return { type: "time", data: `In ${targetLocation}, it's currently ${now.toFormat("hh:mm a")} on ${now.toFormat("cccc, dd LLL yyyy")}.`, brief: true };
  if (/date|today|tomorrow/.test(msg)) {
    const targetDate = /tomorrow/.test(msg) ? now.plus({ days: 1 }) : now;
    return { type: "date", data: `The date in ${targetLocation} is ${targetDate.toFormat("cccc, dd LLL yyyy")}.`, brief: true };
  }
  return null;
}

// ======== AI ARTIFACT CLEANER ========
function cleanAIArtifacts(text) {
  if (!text) return text;

  // ── Broken noun phrases: "what kind of place this ." / "what kind of city this ."
  text = text.replace(/what kind of (place|city|destination|country|town) (this|it)\s*\./gi, 'what kind of place it is.');
  text = text.replace(/not yet sure what (it|this) (is|will be)\s*\./gi, '');
  text = text.replace(/You are not yet sure[^.]*\./gi, '');

  // ── Fix broken sentences: "The atmosphere is , which" → remove broken fragment
  text = text.replace(/\b(is|are|was|were|be|been|being|to|has|have|had)\s*,\s*/g, ' ');

  // ── Fix "designed to be ," patterns
  text = text.replace(/\b(designed to be|intended to|meant to|positioned to|set to)\s*,/g, (match) => match.replace(',', ''));

  // ── Remove dangling sentence ends: "The city is ." / "Paris is ."
  text = text.replace(/\b(\w+)\s+(is|are|was|were)\s*\.\s*/g, (match, noun, verb) => '');

  // ── Fix double spaces
  text = text.replace(/  +/g, ' ');

  // ── Fix common broken phrase patterns
  text = text.replace(/atmosphere is with/gi, 'atmosphere filled with');
  text = text.replace(/experience is with/gi, 'experience complemented by');
  text = text.replace(/city is\s*\./gi, 'city.');
  text = text.replace(/place is\s*\./gi, 'place.');

  // ── Remove orphaned commas
  text = text.replace(/,\s*,/g, ',');
  text = text.replace(/\s+,/g, ',');

  // ── Fix trailing incomplete closings
  text = text.replace(/positioning you\s*\./g, 'positioning you for the rest of the day.');
  text = text.replace(/ensuring you\s*\./g, 'ensuring a smooth experience.');
  text = text.replace(/allowing you\s*\./g, 'allowing you to settle in at your own pace.');
  text = text.replace(/making it\s*\./g, '');
  text = text.replace(/providing you\s*\./g, '');

  // ── Remove lines that are just fragments (under 4 words, no verb)
  text = text.split('\n').filter(line => {
    const words = line.trim().split(/\s+/);
    if (words.length < 3 && !line.includes(':')) return false;
    return true;
  }).join('\n');

  return text.trim();
}

// ======== NARRATIVE POLISHER — WORLD CLASS TONE ========
function narrativePolish(rawText, travelerName, destination, persona = "explorer", day = 1, totalDays = 1) {
  if (!rawText) return rawText;
  let text = rawText;

  // Clean AI artifacts first
  text = cleanAIArtifacts(text);

  const destinationProper = (destination || "")
    .split(" ").map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(" ");

  // Remove AI formatting artifacts
  text = text.replace(/\*\*Day\s*\d+:.*?\*\*/gi, "");
  text = text.replace(/\bItinerary\b/gi, "journey");
  text = text.replace(/\bSchedule\b/gi, "plan");
  text = text.replace(/\bhotel\b(?!\s+[A-Z])/gi, "property");
  text = text.replace(/\baccommodation\b/gi, "place to stay");

  // Ban AI fingerprint words
  AI_WORD_BAN.forEach(word => {
    const regex = new RegExp(`\\b${word}\\b`, 'gi');
    text = text.replace(regex, '');
  });

  // Clean double spaces left by word removal
  text = text.replace(/\s{2,}/g, ' ').trim();
 // Force section headers onto their own lines — catches both ALL CAPS and Title Case
  const headers = [
    'Leaving', 'Your Flight', 'Arriving In', 'Getting To The City',
    'Your Stay', 'First Evening', 'One Thing To Know',
    'Morning', 'The Main Experience', 'Lunch', 'Afternoon', 'Evening', 'Dinner',
    'Final Morning', 'Last Breakfast', 'One More Thing', 'Heading Home', 'Farewell',
    'LEAVING', 'YOUR FLIGHT', 'ARRIVING IN', 'GETTING TO THE CITY',
    'YOUR STAY', 'FIRST EVENING', 'ONE THING TO KNOW',
    'MORNING', 'THE MAIN EXPERIENCE', 'LUNCH', 'AFTERNOON', 'EVENING', 'DINNER',
    'FINAL MORNING', 'LAST BREAKFAST', 'ONE MORE THING', 'HEADING HOME', 'FAREWELL'
  ];
 const sortedHeaders = [...headers].sort((a, b) => b.length - a.length);
  sortedHeaders.forEach(h => {
    const escaped = h.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    text = text.replace(new RegExp(`([^\\n])(${escaped})`, 'gi'), '$1\n\n$2');
  });
  text = text.replace(/\n{3,}/g, '\n\n');
  // Persona-specific opening — calm, precise, human
  const personaOpenings = {
    luxury: `${travelerName}, here is Day ${day} in ${destinationProper}.`,
    couple: `${travelerName}, here is how Day ${day} in ${destinationProper} unfolds for the two of you.`,
    photographer: `${travelerName}, Day ${day} in ${destinationProper} — routed for light and the shots most travelers miss.`,
    foodie: `${travelerName}, Day ${day} in ${destinationProper} — built around the food and the people who make it.`,
    family: `${travelerName}, Day ${day} in ${destinationProper} — paced for everyone.`,
    solo: `${travelerName}, Day ${day} in ${destinationProper} — planned with freedom and clarity.`,
    adventurer: `${travelerName}, Day ${day} in ${destinationProper} — active and off the standard route.`,
    explorer: `${travelerName}, Day ${day} in ${destinationProper}.`
  };

  const opening = personaOpenings[persona] || personaOpenings.explorer;

  // ONE emotional trigger — only Day 1 and last day
  let emotionalTrigger = "";

  if (day === 1) {
    const triggers = {
      luxury: `This is the version of ${destinationProper} that most travelers never reach. You will.`,
      couple: `Some trips are just trips. This one will be different.`,
      photographer: `The light in ${destinationProper} on arrival mornings has a quality that photographers specifically plan around. Today you will understand why.`,
      foodie: `The first real meal in ${destinationProper} tends to rearrange people's relationship with food. Today you will find it.`,
      family: `The moment your family steps out into ${destinationProper} for the first time — remember it. These become the stories they tell when they are grown.`,
      solo: `There is a specific kind of clarity that arrives on the first morning of solo travel in a new city. ${destinationProper} tends to deliver it early.`,
      adventurer: `Day 1 is orientation. By Day 2 you will understand why people come back.`,
      explorer: `First mornings in new cities carry a quality that no photograph captures. Worth experiencing without any agenda at all.`
    };
    emotionalTrigger = triggers[persona] || triggers.explorer;
  }

  if (day === totalDays && totalDays > 1) {
    const triggers = {
      luxury: `The finest journeys do not end — they simply pause. ${destinationProper} will wait.`,
      couple: `Take the long way to the airport. One more coffee somewhere quiet.`,
      photographer: `Last golden hour. Shoot it. Then put the camera down for five minutes and simply look.`,
      foodie: `One last meal. Order something you have not tried yet.`,
      family: `Let the last day be slow. Children remember the unhurried moments most.`,
      solo: `Walk somewhere you have already been and notice what you missed the first time.`,
      adventurer: `One final thing that pushes slightly beyond comfort. Those are always the stories worth telling.`,
      explorer: `${destinationProper} on the way out hits differently than on arrival.`
    };
    emotionalTrigger = triggers[persona] || triggers.explorer;
  }

  text = `${opening}\n\n${text}`;
  if (emotionalTrigger) text += `\n\n${emotionalTrigger}`;

  return text.trim();
}

// ======================================================
// TRIP PLANNING ENGINE — Stage 1
// Makes ALL decisions before any writing happens.
// GPT cannot override these decisions in Stage 2.
// ======================================================
async function planTrip(trip, knowledgeBlock) {
  const totalDays = trip.tripDays || 3;
  const rawName = trip.nickname || trip.name?.split(" ")[0] || "Traveler";
  const travelerName = rawName.charAt(0).toUpperCase() + rawName.slice(1).toLowerCase();
  const isRepeat = trip.firstVisit === "repeat";
  const persona = detectTripPersona(trip);
  const budget = Number(trip.budget || 0);
  const curr = trip.currency || "USD";
  const sym = { USD:"$", EUR:"€", GBP:"£", INR:"₹", AED:"د.إ", CAD:"C$", AUD:"A$", SGD:"S$", JPY:"¥" }[curr] || curr;

  // Random seed ensures variety even for identical inputs
  const varietySeeds = [
    "Lean toward hidden local spots over famous landmarks this trip.",
    "Prioritise culinary depth — make food the emotional thread of this itinerary.",
    "Emphasise contrast — alternate intense experiences with slow, quiet moments.",
    "Prioritise one extraordinary experience per day over multiple average ones.",
    "Lean into the neighbourhood character — ground each day in a specific area of the city.",
    "Build toward an emotional peak on the middle day — everything else supports it.",
    "Prioritise the unexpected — at least one choice per day should surprise even the traveler."
  ];
  const varietySeed = varietySeeds[Math.floor(Math.random() * varietySeeds.length)];

  const planningNow = new Date();
  const planningDate = planningNow.toLocaleDateString('en-GB', { day:'numeric', month:'long', year:'numeric' });
  const planningYear = planningNow.getFullYear();

  const planningPrompt = `You are SKYmora's trip planning engine. Your job is to make DECISIONS — not write the itinerary.

TODAY'S REAL DATE: ${planningDate}. Current year is ${planningYear}. Never use 2024 or 2025 as the current year.

${trip._currentAlerts?.length ? `⚠️ CURRENT ALERTS (checked live today): ${trip._currentAlerts.slice(0,2).map(a => a.title).join(' | ')} — Factor these into your decisions. Avoid flagged areas.` : `✅ No live safety alerts for ${trip.destination} as of today.`}

PLANNING DIRECTION FOR THIS SPECIFIC ITINERARY: ${varietySeed}

TRAVELER: ${travelerName}
DESTINATION: ${trip.destination}
DEPARTURE: ${trip.departure}
DAYS: ${totalDays}
BUDGET: ${sym}${budget} total
PERSONA: ${persona}
VISIT TYPE: ${isRepeat ? "REPEAT VISITOR — has been before, wants the layer below the tourist surface" : "FIRST TIME VISITOR — needs the iconic alongside the genuine"}
TRAVEL PACE: ${trip.travelPace || "balanced"}
TRAVELER EXPERIENCE: ${trip.travelerExperience || "experienced"}
SPECIAL REQUEST: ${trip.specialRequest || "none"}

${knowledgeBlock}

YOUR TASK: Create a day-by-day plan. Make SPECIFIC decisions. Do not be generic.

HARD RULES — these cannot be broken:
1. Burj Khalifa CANNOT appear on Day 1 (travelers arrive tired — the experience is wasted)
2. Each restaurant appears MAXIMUM ONCE across all days — track every restaurant you assign and never repeat it. If you already used Ossiano on Day 3, you CANNOT use it on Day 4.
3. At least one recommendation per day must come from the hidden/local/non-tourist category
4. The designed surprise must appear EXACTLY ONCE across the whole trip (Day 2 or 3)
5. For REPEAT VISITORS: ZERO standard tourist circuit items (no Burj Khalifa, no Dubai Mall primary activity, no Atlantis)
6. Budget allocation: Day 1 = lighter spend (arriving, adjusting), Middle day = peak spend (best experiences), Last day = moderate (departure)
7. VARIETY RULE: Do NOT always pick the single highest-scoring option. For each meal and activity slot, consider the top 3 eligible options and choose one — varying your picks across the itinerary creates a richer, more personal trip. No two itineraries for the same persona should look identical.
8. Every recommendation must have a REASON — not just what, but why this specific choice for this specific traveler
9. For ${totalDays}-day trips: spread the experience — do NOT cluster all landmarks on one day

MEMORY PHILOSOPHY: The goal is not "what attraction comes next" — it is "what will ${travelerName} tell someone about in 5 years?" Every day must have one memory-anchor moment that serves this.

Return ONLY valid JSON. Be concise — every field one sentence maximum:
{
  "persona": "${persona}",
  "visitType": "${isRepeat ? "repeat" : "first"}",
  "dayPlans": [
    {
      "day": 1,
      "dayTitle": "evocative title",
      "emotionTarget": "arrival_wonder — gentle first contact with the city",
      "memoryAnchor": "the one moment they tell people about in 5 years",
      "morning": "activity name + location + why for this traveler",
      "afternoon": "activity name + location + why for this traveler",
      "evening": "activity name + why this emotional note",
      "breakfast": "restaurant + dish",
      "lunch": "restaurant + dish",
      "dinner": "restaurant + dish",
      "hotel": "property name",
      "surprise": null,
      "regret": "regret this prevents",
      "insight": "one insider observation"
    }
  ],
  "surprisePlacement": {
    "day": 2,
    "experience": "experience name",
    "details": "brief details",
    "howToPresent": "how to weave in naturally"
  }
}`;

  try {
    console.log(`🧠 SKYmora Planning Engine — deciding ${totalDays} days for ${travelerName} (${persona}, ${isRepeat ? "repeat" : "first time"})`);

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      response_format: { type: "json_object" },
      temperature: 0.7,
      max_tokens: 4000,
      messages: [
        {
          role: "system",
          content: `You are SKYmora's decision engine. You make precise travel decisions based on traveler psychology and destination intelligence. You NEVER default to generic tourist recommendations when the knowledge data provides better options. You always choose the highest-scoring option for the specific persona. Return valid JSON only.`
        },
        { role: "user", content: planningPrompt }
      ]
    });

    const raw = response.choices?.[0]?.message?.content;
    if (!raw) throw new Error("No response from planning engine");

    const plan = JSON.parse(raw);
    console.log(`✅ Planning complete — ${plan.dayPlans?.length} days planned`);
    return plan;

  } catch (err) {
    console.warn("⚠️ Planning engine failed, falling back to standard generation:", err.message);
    return null;
  }
}

// Helper: detect persona key for planning
function detectTripPersona(trip = {}) {
  const style = (trip.travelStyle || "").toLowerCase();
  const req = (trip.specialRequest || "").toLowerCase();
  const adults = Number(trip.adults || 1);
  const children = Number(trip.children || 0);
  if (req.includes("honeymoon")) return "honeymoon";
  if (style.includes("luxury") || style.includes("elite")) return "luxury";
  if (req.includes("romantic") || req.includes("anniversary")) return "couple";
  if (req.includes("photo")) return "photographer";
  if (req.includes("food") || req.includes("culinary")) return "foodie";
  if (req.includes("adventure")) return "adventure";
  if (children > 0) return "family";
  if (adults === 1) return "solo";
  if (adults >= 2) return "couple";
  return "explorer";
}

// ── Build personalization note deterministically from trip data ──
// 100% reliable, no GPT, no banned words, always specific
function buildPersonalizationNote(trip, day, totalDays, destination) {
  const occasion = trip.emotionalState || "";
  const firstVisit = trip.firstVisit || "first";
  const pace = trip.pace || "balanced";
  const dining = trip.diningPreference || "balanced";
  const personality = trip.travelPersonality || "balanced";
  const special = (trip.specialRequest || "").toLowerCase();
  const isFirst = firstVisit !== "repeat";
  const isLastDay = day === totalDays;
  const isPeakDay = day === Math.ceil(totalDays / 2);

  // Occasion-specific notes
  if (special.includes("honeymoon") || special.includes("anniversary")) {
    if (isFirst && day === 1) return `Because this is your honeymoon and your first visit to ${destination} — the day starts where most visitors never go, so the famous landmarks feel earned rather than obligatory.`;
    if (isPeakDay) return `Because you are celebrating your anniversary — today carries the most weight in the trip, so it holds the most private and specific experiences.`;
    if (isLastDay) return `Because this is a honeymoon — the last morning was kept deliberate and unhurried, so the trip ends the way it deserves to.`;
    return `Because every experience today was chosen to feel like a reward, not a checklist — this is a celebration, and the itinerary was built to feel like one.`;
  }

  if (occasion === "celebrating") {
    return `Because you are celebrating — each experience today was chosen because it rewards, not because it is expected. The city is performing for you today.`;
  }
  if (occasion === "recovering") {
    if (day === 1) return `Because you came here to restore yourself — Day 1 is deliberately light. The city does not need to be rushed, and neither do you.`;
    return `Because rest is the purpose of this trip — today has open windows built in. That is not wasted time. It is the point.`;
  }
  if (occasion === "escaping") {
    return `Because you needed contrast — everything today is designed to feel as different from your daily life as possible.`;
  }

  // First visit notes
  if (isFirst && day === 1) return `Because this is your first visit to ${destination} — the sequence today is intentional. What you see first shapes how you see everything after.`;
  if (isFirst && isPeakDay) return `Because first-time visitors often try to see everything — today focuses on depth over breadth. One experience done properly beats three done quickly.`;

  // Pace notes
  if (pace === "relaxed") {
    return `Because you chose a relaxed pace — this afternoon stays open. Most travelers who over-schedule Day ${day} arrive at dinner already tired. That is a waste of a good city.`;
  }
  if (pace === "packed") {
    return `Because you wanted a full day — every hour today has a purpose, and the transitions between activities were sequenced to avoid backtracking.`;
  }

  // Dining notes
  if (dining === "every meal") {
    return `Because every meal matters to you — both lunch and dinner today were chosen as primary experiences, not afterthoughts. The food carries as much weight as the sights.`;
  }

  // Personality notes
  if (personality === "introvert") {
    return `Because you prefer depth over crowds — today keeps you away from the tourist peak hours and in the parts of the city where genuine experiences happen.`;
  }
  if (personality === "extrovert") {
    return `Because you thrive on connection — today puts you where people actually gather, not where visitors are told to gather.`;
  }

  // Repeat visitor
  if (!isFirst) {
    return `Because you have been here before — today skips the landmarks you already know and goes to the ${destination} that most visitors never reach.`;
  }

  // Default — always returns something specific
  return `Because this is Day ${day} of ${totalDays} — the pacing was set so today builds on yesterday and prepares for tomorrow. The sequence is deliberate.`;
}

// ======== BUILD DAY — COMPLETE INTELLIGENCE ENGINE ========
async function buildDay(trip, day, tripPlan = null) {
  const {
    name = "Traveler", nickname = "", departure, destination = "",
    departureDate = "", adults = 1, children = 0, infants = 0,
    budget = 0, currency = "USD", travelStyle = "", specialRequest = ""
  } = trip;

  // Proper name capitalisation
  const rawName = nickname || name?.split(" ")[0] || "Friend";
  const travelerName = rawName.charAt(0).toUpperCase() + rawName.slice(1).toLowerCase();

  const agentNames = ["Olivia Chen", "Emma Collins", "Ethan Roberts", "Sophia Bennett", "Noah Davis"];
  const assignedAgent = trip.agentData?.name || agentNames[Math.floor(Math.random() * agentNames.length)];
  const agentFirstName = assignedAgent.split(" ")[0];
  const totalDays = trip.tripDays || 5;

  // Smart budget distribution: Day 1 lighter, peak day fuller, last day moderate
  function getSmartDailyBudget(day, totalDays, totalBudget) {
    if (totalDays === 1) return totalBudget;
    if (totalDays === 2) {
      return day === 1 ? Math.round(totalBudget * 0.40) : Math.round(totalBudget * 0.60);
    }
    const peakDay = Math.ceil(totalDays / 2);
    if (day === 1) return Math.round(totalBudget * 0.20);
    if (day === totalDays) return Math.round(totalBudget * 0.25);
    if (day === peakDay) return Math.round(totalBudget * 0.35);
    const remaining = totalBudget - Math.round(totalBudget * 0.20) - Math.round(totalBudget * 0.25) - Math.round(totalBudget * 0.35);
    const otherDays = totalDays - 3;
    return otherDays > 0 ? Math.round(remaining / otherDays) : Math.round(totalBudget / totalDays);
  }

  const dailyBudget = getSmartDailyBudget(day, totalDays, budget);

  const currencySymbols = {
    "USD": "$", "EUR": "€", "GBP": "£", "INR": "₹", "CAD": "C$",
    "AUD": "A$", "SGD": "S$", "AED": "د.إ", "JPY": "¥", "CHF": "CHF"
  };
  const sym = currencySymbols[currency] || "$";

  const isDay1 = (day === 1);
  const totalPeople = Number(adults) + Number(children) + Number(infants);

  // Detect persona FIRST — needed throughout
  const personaMap = (() => {
    const style = (travelStyle || "").toLowerCase();
    const req = (specialRequest || "").toLowerCase();
    if (style.includes("luxury") || style.includes("elite")) return "luxury";
    if (req.includes("honeymoon") || req.includes("romantic")) return "couple";
    if (req.includes("photo") || req.includes("photography")) return "photographer";
    if (req.includes("food") || req.includes("culinary")) return "foodie";
    if (req.includes("adventure") || style.includes("adventure")) return "adventurer";
    if (Number(children) > 0) return "family";
    if (Number(adults) === 1) return "solo";
    return "explorer";
  })();

  // Resolve destination
  const resolvedDestination = resolveDestinationCity(destination);
  if (resolvedDestination !== destination) {
    console.log(`🌍 Destination resolved: ${destination} → ${resolvedDestination}`);
    trip.destination = resolvedDestination;
  }

  // Airport codes
  const depCode = getAirportCode(departure);
  const destCode = getAirportCode(resolvedDestination);

  // Google live data
  const realData = await fetchRealTravelData(trip, day);

  // Build context
  let context = `\n\n=== LIVE GOOGLE DATA — USE EXCLUSIVELY ===\n`;
  context += `Budget: ${sym}${budget} total | ${sym}${dailyBudget}/day\n`;
  context += `Group: ${totalPeople} people | Style: ${travelStyle || "balanced"}\n`;
  context += `Special Request: ${specialRequest || "none"}\n\n`;

  if (realData?.googleContext) {
    context += realData.googleContext;
    context += `\n=== DATA RULES — NON NEGOTIABLE ===\n`;
    context += `ONLY use hotel names found in Google data — NEVER invent names\n`;
    context += `ONLY use airline names found in Google data — NEVER invent airlines\n`;
    context += `ONLY use prices from Google data — NEVER invent numbers\n`;
    context += `ALWAYS honor special request: "${specialRequest}"\n`;
    context += `Persona: ${personaMap} — all recommendations must match this\n\n`;
  }

  // Emotional arc — each day has a distinct register
  const emotionalArcMap = {
    1: {
      register: "arrival_wonder",
      guidance: "The traveller has just landed. They are tired but alert. Everything is new. Write with quiet observation — not excitement, not information delivery. The city is announcing itself. Let the sentences be shorter. Let the spaces breathe.",
      example: "There is a specific quality to the first evening in a new city. You are not yet sure what kind of place it is. That uncertainty is the best version of travel."
    },
    [Math.ceil(totalDays / 2)]: {
      register: "peak_discovery",
      guidance: "This is the day they will tell people about for years. Maximum confidence, maximum engagement. The traveller now knows the city slightly — they move through it with ownership. Write with energy and specificity. Every detail matters.",
      example: "By now the city has started to feel like yours. You know which side of the road the shade falls on. You know which café opens first."
    },
    [totalDays]: {
      register: "farewell_fullness",
      guidance: "The last day. Everything is slower. The traveller is absorbing, not collecting. Write with reflection and unhurried observation. The city is being stored in memory. Sentences should slow down.",
      example: "The last morning in any city has a quality the first morning does not. You are not discovering anymore. You are remembering while it is still happening."
    }
  };
  const currentArc = emotionalArcMap[day] || {
    register: "active_discovery",
    guidance: "Full exploration energy. The traveller is confident and curious. Write with forward momentum — each section leads to the next. Specific details reward their attention.",
    example: "The city is no longer surprising you. It is revealing itself. There is a difference."
  };

  const energyGuide = isDay1
    ? `Arrival day. Emotional register: arrival_wonder. ${currentArc.guidance} Keep it gentle — airport, property, one first impression, light dinner. Example tone: "${currentArc.example}"`
    : day === totalDays
    ? `Departure day. Emotional register: farewell_fullness. ${currentArc.guidance} One final spot. Unhurried. Example tone: "${currentArc.example}"`
    : `Day ${day} of ${totalDays}. Emotional register: ${currentArc.register}. ${currentArc.guidance} Example tone: "${currentArc.example}"`;

  // Emotional state of trip
  const emotionalStateMap = {
    celebrating: "This traveller is celebrating something. The writing should feel like a reward — earned, deserved, elevated. Everything chosen should feel like the best version of itself.",
    recovering: "This traveller needs restoration, not stimulation. Quieter choices. More space. Less packed. The writing should feel like exhaling, not arriving.",
    exploring: "Genuine curiosity drives this trip. Prioritise the unexpected over the expected. The traveller wants to be surprised.",
    escaping: "This traveller needs distance from their normal life. The contrast between here and home should be felt in every section.",
    ticking: "This traveller wants to say they went and saw everything. Efficient coverage of highlights. No loose ends."
  };
  const emotionalStateNote = emotionalStateMap[trip.emotionalState] || "";

  // Occasion-specific writing voice — changes HOW we write about experiences
  const occasionWritingVoice = {
    celebrating: `THIS TRAVELLER IS CELEBRATING SOMETHING. Write every experience as a reward that has been earned. The restaurant is not just good — it is the evening they deserve. The view is not just beautiful — it is the view from the top of something they worked toward. Every sentence should carry the quality of celebration without ever stating it. Use elevated language for ordinary moments. This trip is a gift to themselves.`,

    recovering: `THIS TRAVELLER NEEDS RESTORATION. They are not here to see everything. They are here to remember what quiet feels like. Write with spaciousness — long unhurried sentences, open afternoons, no pressure in the pacing. Never say "you can also fit in..." — that is the wrong energy entirely. The correct sentence is "The afternoon belongs to you." Every activity should feel like permission to slow down, not an obligation to fill the day.`,

    escaping: `THIS TRAVELLER NEEDS CONTRAST. Everything written should emphasise how different this place is from wherever they came from. The food doesn't just taste good — it tastes like nothing they have eaten before. The morning doesn't just start early — it starts in a way that their usual mornings never do. The contrast IS the medicine. Write every observation through the lens of difference.`,

    exploring: `THIS TRAVELLER IS GENUINELY CURIOUS. Write as if the city is revealing itself to someone intelligent and attentive. Not "here are the things to see" but "here is what the city is actually made of." Prioritise the specific and unexpected over the famous and safe. This traveller wants to be surprised by what they find — write toward that surprise.`
  };
  const occasionVoice = occasionWritingVoice[trip.emotionalState] || "";

  // Persona writing voice — rewritten as experiential, not explanatory
  const personaVoice = {
    luxury: `Write what is seen, felt, and noticed — never what is "provided" or "offered". The difference between a good hotel and a great one is not the thread count. It is the moment the door opens and the room is already exactly the right temperature. Describe that moment. Never use the word luxury. Never say "world-class." Show the quality through one specific detail that a person who has stayed there would remember.`,

    couple: `Every sentence should make them want to be there together. Not romantic adjectives — specific situations. The table by the window. The walk back after dinner when neither of you wanted the evening to end. The moment the fountain started and they looked at each other. Write toward those moments, not around them.`,

    honeymoon: `This is the beginning of the rest of their lives. Write with that weight — gently, never dramatically. The best honeymoon moments are private and specific. A courtyard with no one else in it. A breakfast that lasted two hours. Write toward those moments.`,

    photographer: `Time is light. Every activity should specify the exact hour and why that hour matters for the image. Not "golden hour" — "5:47pm when the light hits the west face of the building and the shadows go long." The photographer notices what everyone else walks past. Write from that eye.`,

    foodie: `The dish is the story. Not the restaurant, not the chef, not the setting — the specific dish and what happens when you eat it. The saffron in the rice. The crispness of the batter. The way the chilli sauce arrives in a small ceramic dish without being asked for. Write the meal, not the menu.`,

    family: `Children remember different things than adults do. The unexpected penguin. The bread given to them by the shopkeeper. The moment the older one helped the younger one with something. Build the day around adult logic but leave room for child magic. Be honest about energy levels — overtired children ruin evenings.`,

    solo: `Solo travel is not lonely — it is free. Every recommendation should carry the implication of that freedom. This table faces the room so you can watch everything. This walk has no fixed end point. This morning is entirely yours. Write toward the specific pleasure of moving through a city entirely at your own pace.`,

    adventurer: `Effort earns the view. The harder the approach, the more the destination means. Write with the physical intelligence of someone who has done it — how the legs feel on the ascent, what the air smells like at altitude, the specific satisfaction of sitting down after something that required something. Numbers matter: how far, how high, how long.`,

    explorer: `Write like a well-travelled friend who happens to know this city well. Not a guidebook — a person. One specific thing that residents know and tourists don't. The detail that makes a stranger feel like an insider. The observation that makes the city feel knowable.`
  };

  const voiceInstruction = personaVoice[personaMap] || personaVoice.explorer;

  // Local intelligence lines
  const localIntelligence = isDay1 ? `
ONE THING TO KNOW section: Do NOT write generic safety or packing advice. Write ONE specific, local, timing-based observation that only someone who knows this city well would say. It must reference a specific time, place, or behaviour pattern.
Bad example: "Dubai is hot in summer so wear light clothing."
Good example: "The Gold Souk alley at 9:30am on a weekday has fewer than ten people in it. By noon it has hundreds. The shopkeeper who ignored you at noon will spend twenty minutes explaining the difference between his saffron and the supermarket version at 9:30am. The timing is the intelligence."` : `
Include one LOCAL INTELLIGENCE line that references either: (a) a specific time window and why it matters, OR (b) a contrast between what most visitors do and what this plan does differently.`;

  const emotionalStateInstruction = emotionalStateNote ? `\nTRIP EMOTIONAL CONTEXT: ${emotionalStateNote}\n` : "";


  // Build destination knowledge block
  const knowledgeBlock = buildKnowledgeBlock({
    destination: resolvedDestination,
    travelStyle: trip.travelStyle || "",
    specialRequest: trip.specialRequest || "",
    adults: trip.adults || 1,
    children: trip.children || 0,
    firstVisit: trip.firstVisit || "first",
    budget: trip.budget || 0,
    currency: trip.currency || "USD"
  });

  // Build locked day brief from trip plan (if available)
  const dayPlan = tripPlan?.dayPlans?.find(p => p.day === day);
  const surprisePlan = tripPlan?.surprisePlacement;

  const lockedBrief = dayPlan ? `
=== LOCKED DAY BRIEF — FOLLOW EXACTLY ===
These decisions were made by the planning engine based on traveler psychology and destination intelligence.
You are writing the narrative. You are NOT choosing the venues. They are already chosen.

DAY TITLE: ${dayPlan.dayTitle || ""}
EMOTION TARGET: ${dayPlan.emotionTarget || ""}
MEMORY ANCHOR: ${dayPlan.memoryAnchor || ""}

MORNING ACTIVITY: ${dayPlan.morning || dayPlan.morningActivity || ""}
AFTERNOON ACTIVITY: ${dayPlan.afternoon || dayPlan.afternoonActivity || ""}
EVENING ACTIVITY: ${dayPlan.evening || dayPlan.eveningActivity || ""}

BREAKFAST: ${dayPlan.breakfast || ""}
LUNCH: ${dayPlan.lunch || ""}
DINNER: ${dayPlan.dinner || ""}

HOTEL: ${dayPlan.hotel || ""}

${(dayPlan.surprise && dayPlan.surprise !== 'null') || (surprisePlan?.day === day) ? `DESIGNED SURPRISE (weave naturally into the narrative — do not present as a recommendation):
Experience: ${dayPlan.surprise || surprisePlan?.experience || ""}
Details: ${surprisePlan?.details || ""}
How to present: ${surprisePlan?.howToPresent || "present as something discovered, not prescribed"}` : ""}

REGRET CONTRAST — do NOT state this directly. Imply it as a contrast: ${dayPlan.regret || dayPlan.regretPrevention || ""}
Write it as: "Most visitors do X. You will not." — never as "this prevents regret about X."

LOCAL INSIGHT FOR TODAY — use verbatim if provided, do not paraphrase: ${dayPlan.insight || dayPlan.localInsight || ""}
EMOTION TARGET FOR THIS DAY: ${dayPlan.emotionTarget || currentArc.register}
MEMORY ANCHOR — the one moment they describe in 5 years: ${dayPlan.memoryAnchor || ""}

TIMING INTELLIGENCE — every activity MUST state: (1) the exact time, (2) why that specific time matters.
Not "visit in the morning" — "arrive at 9:30am — before the crowds, before the heat, when the shopkeepers have time to talk."

CRITICAL RULES:
- Write ONLY the venues in the locked brief above. NEVER substitute from your training data.
- Every sentence must be complete. Never end with "is ," or "to be ," or "positioning you."
- Regret prevention is implied through contrast, never stated.
- The timing of every activity must be specific and explained.
=== END LOCKED BRIEF ===
` : `
${knowledgeBlock}
`;

  // Real system date — never hardcoded
  const systemNow = new Date();
  const systemDate = systemNow.toLocaleDateString('en-GB', { day:'numeric', month:'long', year:'numeric' });
  const systemYear = systemNow.getFullYear();

  const prompt = `You are a senior travel consultant at SKYmora with 15 years of personal experience in ${resolvedDestination}.

TODAY IS: ${systemDate}. The current year is ${systemYear}. Never reference 2024 or 2025 as the current year. Use ${systemYear} for all date context.

You are writing Day ${day} of ${totalDays} for ${travelerName}.

TRAVELER PROFILE:
Name: ${travelerName} | Route: ${departure} (${depCode}) → ${resolvedDestination} (${destCode})
Date: ${departureDate} | Group: ${adults} adult(s)${children ? `, ${children} children` : ""}${infants ? `, ${infants} infants` : ""}
Budget: ${sym}${budget} total | ${sym}${dailyBudget}/day
Travel Style: ${travelStyle || "balanced"} | Special Request: ${specialRequest || "none"}
Persona: ${personaMap}
Visit Status: ${trip.firstVisit === "repeat" ? "REPEAT VISITOR — deeper, local itinerary. NO standard tourist circuit." : "FIRST TIME VISITOR — iconic + genuine balance."}
Travel Pace: ${trip.travelPace === "relaxed" ? "RELAXED — maximum 2 activities, long meals, open afternoons." : trip.travelPace === "packed" ? "PACKED — energetic, 4-5 activities, efficient transitions." : "BALANCED — 3 activities, one great meal, one breathing space."}
Travel Experience: ${trip.travelerExperience === "first_intl" ? "FIRST INTERNATIONAL TRIP — include logistics detail, customs info, safety context naturally." : trip.travelerExperience === "moderate" ? "SOME EXPERIENCE — skip absolute basics, include destination-specific intelligence." : "SEASONED — skip all logistics basics, straight to deep intelligence."}
${trip.emotionalState ? `Trip Occasion: ${emotionalStateMap[trip.emotionalState] || ""}` : ""}
Dining Importance: ${trip.diningDepth === "fuel" ? "Food is fuel — quick, efficient, good enough." : trip.diningDepth === "one_great" ? "One extraordinary meal. The rest can be simple." : trip.diningDepth === "every_meal" ? "Every meal is an event. Food IS the trip." : "Good food matters but does not dominate."}
Social Preference: ${trip.socialComfort === "meet_people" ? "Wants to meet other travellers — recommend social settings." : trip.socialComfort === "independent" ? "Prefers complete independence — no group activities, solo experiences." : "Balanced social."}
Travel Personality: ${trip.travelPersonality === "introvert" ? "INTROVERT — prioritise quiet neighbourhoods, solo counters, independent cafés, morning walks before crowds. Avoid loud group activities. Build in solitude." : trip.travelPersonality === "extrovert" ? "EXTROVERT — prioritise rooftop bars, night markets, group food tours, social settings. Evenings should be energetic and social." : "BALANCED personality — mix of social and quiet experiences."}
Planning Style: ${trip.planningStyle === "planner" ? "PLANNER — fill every slot, include reservations needed, specific timings. Leave nothing ambiguous." : trip.planningStyle === "spontaneous" ? "SPONTANEOUS — give 2 anchors per day maximum, leave afternoons deliberately open, no rigid timing. Write in a way that invites deviation." : "BALANCED planner — structured morning, open afternoon."}
Trip Length Context: ${totalDays <= 2 ? `VERY SHORT TRIP (${totalDays} days) — ruthless prioritisation. One iconic experience per day maximum. Cut everything secondary.` : totalDays <= 4 ? `SHORT TRIP (${totalDays} days) — focus on the 2-3 experiences that define this destination. No day trips. No rushed overview.` : totalDays <= 6 ? `MEDIUM TRIP (${totalDays} days) — now depth is possible. Mix iconic with hidden. One day trip viable.` : `LONG TRIP (${totalDays}+ days) — full depth. Neighbourhoods, day trips, slow mornings. The traveller can now truly understand the city.`}

${trip._currentAlerts?.length ? `
⚠️ LIVE CURRENT REALITY ALERTS — READ BEFORE WRITING:
${trip._currentAlerts.map(a => `- ${a.title}: ${a.snippet}`).join('\n')}
CRITICAL: These are real-time alerts from today (${new Date().toLocaleDateString('en-GB')}). Acknowledge relevant alerts naturally in the itinerary. Adjust recommendations if safety is affected. Be honest — a traveller's safety matters more than a positive itinerary. If an area is flagged as unsafe, recommend an alternative.
` : `✅ No current travel alerts or advisories detected for ${resolvedDestination} as of ${new Date().toLocaleDateString('en-GB')}.`}

${context}

${lockedBrief}

DAY ENERGY:
${energyGuide}

WRITING VOICE FOR THIS TRAVELER (${personaMap.toUpperCase()}):
${voiceInstruction}

=== THE SKYmora WRITING STANDARD ===

BANNED WORDS — never use these:
vibrant, nestled, charming, unforgettable, extraordinary, delightful, immersive,
enchanting, magical, breathtaking, stunning, incredible, amazing, wonderful,
fantastic, luxurious, picturesque, serene, tranquil, world-class

Instead of describing feelings — describe specific observable facts.
BAD: "The hotel is charming and nestled in a vibrant neighborhood."
GOOD: "The property sits on a quieter street two blocks from the main avenue — shorter commute, significantly better restaurants nearby."

PRICING INTELLIGENCE — use this exact approach:
Do NOT say: "Flight costs $920"
DO say: "We compared fares across platforms for your dates. Current pricing from ${departure} to ${resolvedDestination} sits slightly above seasonal average. If your dates shift by one or two days midweek, fares typically fall 12-18%. Best current value: [specific airline from Google data] — [reason why this specific option]."

WHY THIS OPTION — every major recommendation needs a reason:
Not just what. Why.
BAD: "Stay at The Hoxton in Chelsea."
GOOD: "The Hoxton in Chelsea. Chelsea gives faster subway access than Midtown, safer late-night movement, and stronger restaurant options at this budget. The property itself runs quieter than its location suggests."

PACE INTELLIGENCE — acknowledge when you are intentionally keeping things light:
"This afternoon stays deliberately open. Most travelers over-schedule Day 1 and arrive at dinner already tired. That is a waste of a good city."

${occasionVoice ? `\nOCCASION-SPECIFIC WRITING INSTRUCTION:\n${occasionVoice}\n` : ''}

${localIntelligence}

FAKE URGENCY — completely banned:
Never say: "books out fast", "selling quickly", "limited availability"
Instead inform intelligently: "Current pricing on this route is strong for the season. Midweek dates tend to perform better if flexibility exists."

FLIGHT DURATION FACTS — CRITICAL, DO NOT CONTRADICT THESE EVER:
- New Delhi to Dubai: DIRECT = 3 hours 30 minutes to 4 hours. NEVER write 16 hours. NEVER write 8 hours. 3.5 hours is correct.
- Mumbai to Dubai: DIRECT = 3 hours.
- New Delhi to Paris: DIRECT = 8 to 9 hours. Air France, Air India. NEVER write 3.5 hours for Delhi-Paris.
- Mumbai to Paris: DIRECT = 9 hours.
- New Delhi to Singapore: DIRECT = 5 hours 30 minutes to 6 hours.
- New Delhi to Bangkok: DIRECT = 4 hours 30 minutes.
- New Delhi to London: DIRECT = 9 hours.
- New Delhi to Tokyo: DIRECT = 9 to 10 hours.
- New Delhi to New York: DIRECT = 14 to 15 hours.
- New Delhi to Bali: Via Singapore or Kuala Lumpur = 8 to 10 hours total.
- New Delhi to Maldives: DIRECT = 3 hours 30 minutes.
If Google data shows a different duration, verify against these hard facts. These are correct.

=== SECTION FORMAT ===
Break the day into named sections with clear visual separation.

RULES:
- Every section header must be completely alone on its own line
- One blank line after every header before content begins
- One blank line after content before the next header
- Keep your full explanations, WHY reasoning, and pricing intelligence
- Never shorten or compress content — just organize into sections
- Every day must use sections — middle days included
LEAVING NEW DELHI

Your journey begins at Indira Gandhi International. Air India DEL to JFK. INR 220,457 return. Three hours before departure.

YOUR FLIGHT

Air India AI101. 3 hours 30 minutes direct (Delhi-Dubai). Meal service included. Best value on this route currently.

ARRIVING IN DUBAI

DXB customs typically 30 to 45 minutes on arrival. June weather — around 38 degrees, light breathable clothing essential.
PERSONALIZATION PROOF — within the first 2 paragraphs of every day, include at least ONE of these lines naturally (pick what is true for this traveler):
${trip.emotionalState === 'celebrating' ? `"Because you are celebrating — [specific experience] was chosen because it rewards, not just entertains."` : ''}
${trip.emotionalState === 'recovering' ? `"Because you need restoration — today is deliberately unhurried. The city will wait."` : ''}
${trip.emotionalState === 'escaping' ? `"Because you needed contrast — everything today is designed to feel different from home."` : ''}
${trip.travelPersonality === 'introvert' ? `"Because you prefer depth over breadth — one neighbourhood explored properly beats three rushed."` : ''}
${trip.travelPersonality === 'extrovert' ? `"Because you thrive on connection — today puts you where people actually gather."` : ''}
${trip.firstVisit === 'first' ? `"Because this is your first time — the sequence matters. What you see first shapes how you see everything after."` : ''}
${trip.pace === 'relaxed' ? `"Because you chose a relaxed pace — this afternoon stays open. That is not wasted time. It is the point."` : ''}
${trip.diningPreference === 'every meal' ? `"Because every meal matters to you — both lunch and dinner today were chosen as experiences, not conveniences."` : ''}
${trip.specialRequest ? `"Because you mentioned ${trip.specialRequest} — this day was shaped around that specifically."` : ''}

WHY I CHOSE THIS — after every major recommendation (hotel, main activity, dinner), include a WHY paragraph:
Format exactly: "WHY I CHOSE THIS: [1-2 sentences explaining the specific decision logic for THIS traveler]"
Examples:
- "WHY I CHOSE THIS: Deira first because seeing old Dubai before modern Dubai makes the towers feel more impressive, not less. Almost every first-timer gets this sequence wrong."
- "WHY I CHOSE THIS: The Burj at 8:30am because the observation deck has under 50 people at that hour. By 11am it has 500. Same view. Completely different experience."
- "WHY I CHOSE THIS: This restaurant because the kitchen closes at 10:30pm and the reservation needs to be at 8pm. Arriving later means the best dishes are gone."

HOTEL JUSTIFICATION — in YOUR STAY section, after the hotel name, add:
"WHY THIS HOTEL: [distance to key Day 1, 2, 3 attractions] | [what this location saves in travel time] | [why this is right for this specific trip length and traveler type]"

SECTIONS FOR DAY ${isDay1 ? `1:
LEAVING ${departure.toUpperCase()}
YOUR FLIGHT
ARRIVING IN ${resolvedDestination.toUpperCase()}
GETTING TO THE CITY
YOUR STAY — include WHY THIS HOTEL after the hotel name
FIRST EVENING
ONE THING TO KNOW — MUST reference: (a) a specific regret most first-timers have AND how this plan prevents it, OR (b) a specific insider timing/price fact. Not generic.` : day === totalDays ? `${day}:
FINAL MORNING
LAST BREAKFAST
ONE MORE THING — reference something specific from the destination knowledge that most travelers miss entirely. Feel like a secret.
HEADING HOME
FAREWELL` : `${day}:
MORNING — explain what this neighbourhood feels like at this hour and WHY that matters for this traveler
THE MAIN EXPERIENCE — include WHY I CHOSE THIS after the recommendation
LUNCH
AFTERNOON
EVENING
DINNER — include the specific dish, arrival time (timing intelligence), and WHY I CHOSE THIS restaurant for today specifically`}

AGENT SIGNATURE — end every day card with:
"Prepared for ${travelerName} — ${agentFirstName}, SKYmora Travel Team"
RULES:
- Maximum 2 emojis in the ENTIRE day card content
- Each section maximum 4 sentences
- Address ${travelerName} by name once — opening line only
- Use ONLY real names and prices from Google data above
- Title must be specific: "Day 1: Arrival in ${resolvedDestination}" not "Day 1: ${resolvedDestination}"
- Airport codes in content: ${depCode} → ${destCode}

Return ONLY this JSON — every field is required:
{
  "day": ${day},
  "title": "Day ${day}: [Specific Title]",
  "content": "[Full sectioned content as described above]",
  "dailyCost": [number],
  "budgetStatus": "Within budget",
  "depCode": "${depCode}",
  "destCode": "${destCode}",
  "personalizationNote": "[ONE sentence starting with 'Because' explaining why this specific day was designed for THIS traveler — reference their occasion, personality, visit type, or pace. Example: 'Because this is your first visit, today starts with old Dubai so the modern city feels earned rather than assumed.']",
  "whyChoices": [
    {
      "for": "[hotel name OR main activity name OR dinner restaurant name]",
      "reason": "[1-2 sentences of specific decision logic for THIS traveler. Not generic. Reference location advantage, time saving, or why it fits their occasion/pace/personality.]"
    },
    {
      "for": "[second recommendation]",
      "reason": "[specific reason]"
    },
    {
      "for": "[dinner or evening highlight]",
      "reason": "[specific reason — include timing logic if relevant]"
    }
  ]
}`;

  try {
    console.log(`🖊️ Writing Day ${day} for ${travelerName} [${personaMap}]...`);

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      response_format: { type: "json_object" },
      temperature: 0.72,
      max_tokens: 4000,
      messages: [
        {
          role: "system",
          content: `You are an elite travel writer at SKYmora. Precise. Human. Specific. Never generic.

BANNED WORDS — never use anywhere including in whyChoices and personalizationNote:
vibrant, nestled, charming, unforgettable, extraordinary, delightful, immersive, enchanting, magical, breathtaking, stunning, incredible, amazing, wonderful, fantastic, luxurious, picturesque, serene, tranquil, elevate, resonate, impactful, memorable.

SENTENCE RULE: Every sentence must be complete. No sentence ends with "is ," or "are ," or "to ,".

SECTION HEADERS: Plain text only — no brackets, no emojis.

PERSONALIZATION NOTE RULE:
- Must start with "Because"
- Must reference something SPECIFIC about this traveler (their occasion, first/repeat visit, pace preference, or dining preference)
- Must explain a concrete decision — not a feeling
- BAD: "Because you are celebrating, this day was designed to feel special."
- GOOD: "Because this is your first visit, today starts with old Dubai before the modern city — the sequence is intentional, because seeing the towers before the Creek makes the towers seem hollow."
- BAD: "Because you love food, meals were prioritized."
- GOOD: "Because every meal matters to you, both lunch and dinner today have specific dishes worth ordering — the tasting menu at Trèsind is a set sequence, and arriving 15 minutes early is the difference between a warm table and a rushed one."

WHY CHOICES RULE:
- Each reason must be SPECIFIC to this traveler, not generic praise
- Reference time, location advantage, occasion fit, or trip sequencing
- BAD: "This is a great restaurant for a romantic dinner."
- GOOD: "Trèsind Studio on an anniversary because the tasting menu has a natural ceremony to it — each course is announced — and the kitchen accommodates the occasion if told in advance."
- BAD: "Burj Khalifa at 8:30am for the best experience."
- GOOD: "Burj Khalifa at 8:30am because the deck has fewer than 50 people at that hour. By 11am it has 500. The view is identical. The experience is completely different."

Return ALL JSON fields. A missing or generic personalizationNote is a failure. A whyChoices reason that could apply to any traveler is a failure.`
        },
        { role: "user", content: prompt }
      ]
    });

    const raw = completion?.choices?.[0]?.message?.content;
    if (!raw) throw new Error("No response from OpenAI");

    const parsed = JSON.parse(raw);

    if (!parsed.content) {
      parsed.content = `${travelerName}, Day ${day} in ${resolvedDestination} is being prepared. One moment.`;
    }

    parsed.content = narrativePolish(parsed.content, travelerName, resolvedDestination, personaMap, day, totalDays);

    // ── Generate personalizationNote deterministically from trip data ──
    // This is 100% reliable — no GPT hallucination, no banned words
    parsed.personalizationNote = buildPersonalizationNote(trip, day, totalDays, resolvedDestination);

    // ── Improve whyChoices — replace vague phrases with specific ones ──
    if (Array.isArray(parsed.whyChoices)) {
      const replacements = [
        [/\bunforgettable\b/gi, 'worth remembering'],
        [/\bbreathtaking\b/gi, 'genuinely impressive'],
        [/\bstunning\b/gi, 'striking'],
        [/\bincredible\b/gi, 'exceptional'],
        [/\bamazing\b/gi, 'strong'],
        [/\bmagical\b/gi, 'distinctive'],
        [/\bextraordinary\b/gi, 'notable'],
        [/\bluxurious\b/gi, 'high-end'],
        [/\bserenity\b/gi, 'quiet'],
        [/\bimmersive\b/gi, 'absorbing'],
        [/\belevate your\b/gi, 'improve your'],
        [/\bculminating in a memorable\b/gi, 'ending well'],
        [/\bperfect for\b/gi, 'well-suited for'],
        [/\bculinary adventure\b/gi, 'food experience'],
        [/\bunique experience\b/gi, 'specific experience']
      ];
      parsed.whyChoices = parsed.whyChoices.map(w => {
        let reason = w.reason || '';
        replacements.forEach(([pattern, replacement]) => {
          reason = reason.replace(pattern, replacement);
        });
        return { ...w, reason: reason.trim() };
      }).filter(w => w.for && w.reason && w.reason.length > 20);
    }
    parsed.depCode = parsed.depCode || depCode;
    parsed.destCode = parsed.destCode || destCode;
parsed.resolvedDestination = resolvedDestination;
    // Fetch destination photo
    try {
      const photo = await getDestinationPhoto(resolvedDestination, day);
      if (photo) parsed.photo = photo;
    } catch (photoErr) {
      console.warn("📷 Photo fetch skipped:", photoErr.message);
    }

    console.log(`✅ Day ${day} complete — Persona: ${personaMap}`);
    return parsed;

  } catch (err) {
    console.error("❌ BUILD ERROR:", { message: err.message, day, destination: resolvedDestination });
    return {
      day,
      title: `Day ${day}: ${resolvedDestination}`,
      content: `${travelerName}, gathering verified data for Day ${day} in ${resolvedDestination}. One moment.`
    };
  }
}

// ======== BACKGROUND GENERATION ========
async function generateInBackground(tripId, trip, startAt, totalDays, tripPlan = null) {
  const entry = itineraries.get(tripId);
  if (!entry) return;

  // Use stored plan if not passed directly
  const plan = tripPlan || entry.tripPlan || null;

  for (let d = startAt + 1; d <= totalDays; d++) {
    await new Promise(r => setTimeout(r, 3000));
    const dayObj = await buildDay(trip, d, plan);
    entry.days.push(dayObj);

    if (d === totalDays) {
      entry.complete = true;
      const rawName = trip.nickname || trip.name?.split(" ")[0] || "Friend";
      const travelerName = rawName.charAt(0).toUpperCase() + rawName.slice(1).toLowerCase();
      const budgetDisplay = `${trip.currency} ${Number(trip.budget).toLocaleString()}`;
      const resolvedDest = resolveDestinationCity(trip.destination || "");
      const destProper = resolvedDest.split(" ").map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(" ");

      const persona = (() => {
        const style = (trip.travelStyle || "").toLowerCase();
        const req = (trip.specialRequest || "").toLowerCase();
        if (style.includes("luxury")) return "luxury";
        if (req.includes("honeymoon") || req.includes("romantic")) return "couple";
        if (req.includes("photo")) return "photographer";
        if (req.includes("food")) return "foodie";
        if (Number(trip.children) > 0) return "family";
        if (Number(trip.adults) === 1) return "solo";
        return "explorer";
      })();

      const assignedAgent = trip.agentData?.name || "Olivia Chen";
      const agentFirst = assignedAgent.split(" ")[0];

      const agentClosers = {
        "Olivia": [
          `${travelerName}, I put genuine thought into every detail of this journey — your pace, your budget, the way you like to experience a place. This is not a template. This is ${destProper}, planned specifically for you.\nIf anything feels off — a different neighbourhood, a different restaurant, a change in timing — I am right here. The chat is just below and I would genuinely love to make this perfect for you. — Olivia Chen`,
          `${travelerName}, crafting this itinerary was a pleasure. Every choice — the property, the restaurants, the route through the city — was made with you specifically in mind.\nNo question is too small. If something needs adjusting before you travel, please reach out through the chat below. I am waiting and happy to help. — Olivia Chen`,
          `${travelerName}, this is your ${destProper} — ${trip.tripDays} days designed around exactly how you travel. Every price is real, every recommendation has a reason, and nothing was left to chance.\nI would love to hear from you if anything needs a tweak. The chat below is open and I am genuinely eager to make this the best possible version of your trip. — Olivia Chen`,
          `${travelerName}, the best journeys are the ones that feel personal from the very first day. That is exactly what I tried to create for you here.\nIf you have any questions, any changes in mind, or simply want to talk through the plan — please reach out through the chat below. I am here and I want this trip to be everything you are hoping for. — Olivia Chen`,
          `${travelerName}, every traveler deserves a journey that feels made for them. I hope this one does.\nThe chat below is open — whether it is a small change or a big one, I am here and genuinely looking forward to hearing from you. Let us make this perfect together. — Olivia Chen`,
          `${travelerName}, this plan took care and attention to build. ${destProper} rewards the traveler who goes in prepared, and you are prepared.\nAnything you want to change or explore further — I am right below in the chat. I am here for exactly this. — Olivia Chen`
        ],
        "Emma": [
          `${travelerName}, I built this journey to prove that a well-planned trip does not need to feel like a compromise. Every choice here delivers more than its price suggests — that was the goal from the very start.\nIf anything needs changing, please reach out through the chat below. I am genuinely excited to help you refine this further. — Emma Collins`,
          `${travelerName}, your budget was not a limitation here. It was a challenge I took personally. Every recommendation was chosen to make your money work as hard as possible without sacrificing a single moment.\nI would love to hear from you if you want to adjust anything. The chat is just below and I am ready and waiting. — Emma Collins`,
          `${travelerName}, this is ${destProper} done properly — not expensively, but properly. There is a difference and this plan understands it.\nIf something does not feel right or you want to explore a different direction, I am here. Chat below, reach out anytime. I genuinely want this trip to exceed your expectations. — Emma Collins`,
          `${travelerName}, I planned this the way I would plan it for someone whose money I was spending myself — carefully, deliberately, without a single wasted choice.\nThe chat below is open and I am eager to hear from you. Any question, any change, any idea — bring it to me. — Emma Collins`,
          `${travelerName}, the best feeling in travel planning is when a traveler realises they got far more than they expected. That is exactly what I built this for.\nPlease reach out through the chat below if anything needs adjusting. I am here, I am enthusiastic, and I want to make this perfect for you. — Emma Collins`,
          `${travelerName}, every price in this plan was verified, every option was compared, and every choice was made with your experience in mind — not just your budget.\nIf you want to talk through anything or make any changes before you travel, the chat is right below. I would love to hear from you. — Emma Collins`
        ],
        "Ethan": [
          `${travelerName}, this plan was built with energy and purpose — every day designed to give you something real, something that pushes slightly beyond the ordinary.\nIf you want to add more edge or simply have questions before you go — I am right here in the chat below. I am genuinely excited about this trip for you. — Ethan Roberts`,
          `${travelerName}, ${destProper} rewards the traveler who goes in with a plan and the confidence to follow it. You have both now.\nIf anything feels like it needs more intensity or a different direction — the chat is below and I am ready to dig in with you. Let us make this exactly what you want. — Ethan Roberts`,
          `${travelerName}, I built this itinerary around the belief that the best travel moments are the ones that required something from you. This plan has those built in.\nAnything you want to adjust — reach out through the chat below. I am here and genuinely looking forward to talking this through with you. — Ethan Roberts`,
          `${travelerName}, ${trip.tripDays} days in ${destProper} — planned with zero wasted hours and maximum experience at every turn.\nIf you want to push the plan further or have any questions, I am just below in the chat. I love refining a good itinerary. — Ethan Roberts`,
          `${travelerName}, the traveler who goes in prepared always gets more out of a destination. This plan makes sure you are that traveler.\nThe chat below is open — any changes, any questions, anything you want to add. I am here and eager to help. — Ethan Roberts`,
          `${travelerName}, I planned this with intention, energy, and you at the centre of every decision.\nIf anything needs changing before you travel, please reach out through the chat below. I am waiting and genuinely excited to make this even better for you. — Ethan Roberts`
        ],
        "Sophia": [
          `${travelerName}, precision is the only standard I work to. Every choice in this itinerary — every property, every restaurant, every route — was the strongest available option within your parameters.\nIf anything needs refining before you travel, I am here. The chat below is open and I would be genuinely pleased to make this exactly right for you. — Sophia Bennett`,
          `${travelerName}, this is ${destProper} at the level it deserves to be experienced. Nothing in this plan is accidental and nothing is generic.\nIf you have questions or want to explore adjustments, please reach out through the chat below. I care deeply about getting this right for you. — Sophia Bennett`,
          `${travelerName}, the difference between a good trip and the right trip is in the details. I have taken care of the details.\nThe chat below is open — any question, any refinement, any idea you have. I am waiting and genuinely looking forward to hearing from you. — Sophia Bennett`,
          `${travelerName}, I do not do generic. Every recommendation in this plan earned its place — compared, verified, and chosen for a specific reason.\nIf anything needs adjusting before you travel, please do not hesitate to reach out through the chat below. I am here for exactly this. — Sophia Bennett`,
          `${travelerName}, ${trip.tripDays} days in ${destProper} — curated with the care this destination deserves and the attention your journey requires.\nThe chat is just below and I would genuinely love to hear from you if anything needs to change. — Sophia Bennett`,
          `${travelerName}, this plan reflects a standard I hold myself to — nothing included by default, everything chosen with purpose.\nPlease reach out through the chat below if you have any questions. I am here, I am ready, and I want this to be perfect for you. — Sophia Bennett`
        ],
        "Noah": [
          `${travelerName}, I have planned journeys for every kind of traveler and every kind of destination. This one was built around exactly how you travel — your pace, your style, your budget.\nThe chat below is open and I would genuinely love to hear from you if anything needs adjusting. I am here and ready to help. — Noah Davis`,
          `${travelerName}, the best travel plans feel personal because they are. This one was built for you specifically — not adapted from a template, not generated from a formula.\nIf you have questions or want to make changes, please reach out through the chat below. I am genuinely eager to help. — Noah Davis`,
          `${travelerName}, ${destProper} has something remarkable to offer every traveler who comes prepared. This plan makes sure you are prepared.\nAnything needs changing or you simply want to talk through the details — I am just below in the chat. — Noah Davis`,
          `${travelerName}, I built this with care and without assumptions. Every choice was made with your specific journey in mind.\nThe chat below is open — any question, any change, any idea you have. I am here and looking forward to hearing from you. — Noah Davis`,
          `${travelerName}, travel is personal. Planning should be too. That is exactly the approach I took with this itinerary.\nIf anything feels like it needs a different direction, please reach out through the chat below. I am ready and genuinely happy to help. — Noah Davis`,
          `${travelerName}, ${trip.tripDays} days in ${destProper} — planned with flexibility, purpose, and you at the centre of every decision.\nThe chat is right below and I am waiting. Any question, any change — bring it to me. — Noah Davis`
        ],
        "Liam": [
          `${travelerName}, culture is not something you observe on this trip — it is something you step into. Every recommendation was chosen to take you deeper than the surface of ${destProper}.\nIf you want to explore a different angle or have any questions at all, please reach out through the chat below. I am genuinely excited about this journey for you. — Liam Patel`,
          `${travelerName}, the real ${destProper} is not always the one in the guidebooks. This plan knows the difference.\nThe chat below is open — any questions, any changes, anything you want to add. I would genuinely love to hear from you before you travel. — Liam Patel`,
          `${travelerName}, I built this itinerary around the belief that the most meaningful travel experiences come from going deeper, not just further.\nIf anything needs adjusting, please reach out through the chat below. I am here and eager to help make this perfect. — Liam Patel`,
          `${travelerName}, ${trip.tripDays} days in ${destProper} — planned around the experiences that stay with you long after you come home.\nThe chat is just below and I am waiting. Any question, any idea, any change — reach out. — Liam Patel`,
          `${travelerName}, every destination has a version that most travelers miss entirely. This plan makes sure you do not miss it.\nIf you have questions or want to explore any adjustments, please reach out through the chat below. I am genuinely looking forward to hearing from you. — Liam Patel`,
          `${travelerName}, I planned this with the curiosity of someone who loves ${destProper} and the care of someone who wants you to love it too.\nThe chat below is open — please do not hesitate to reach out. Any change, any question. I am here and ready. — Liam Patel`
        ],
        "Alexander": [
          `${travelerName}, elite travel is not about spending more — it is about experiencing more of what actually matters. Every choice in this plan reflects that.\nIf anything needs refining before you travel, I am here. The chat below is open and I would be honoured to make this exactly right for you. — Alexander Cruz`,
          `${travelerName}, this is ${destProper} at the highest level available within your parameters. Nothing was left to chance and nothing was chosen by default.\nPlease reach out through the chat below if you want to explore any adjustments. I am here and genuinely invested in making this extraordinary for you. — Alexander Cruz`,
          `${travelerName}, the finest journeys are the ones where every detail has been considered before you arrive. That is what I have done here.\nThe chat is open below — any question, any refinement. I am waiting and looking forward to hearing from you. — Alexander Cruz`,
          `${travelerName}, I curate experiences for travelers who expect the best and understand the difference when they experience it. This plan was built with you in mind.\nIf anything needs changing before you travel, please reach out through the chat below. I am here for exactly this. — Alexander Cruz`,
          `${travelerName}, ${trip.tripDays} days in ${destProper} — every element selected for maximum impact, minimum friction, and the kind of experience that stays with you.\nThe chat is just below. I am here and genuinely eager to hear from you. — Alexander Cruz`,
          `${travelerName}, excellence is a standard, not an aspiration. This plan reflects that standard.\nPlease reach out through the chat below if you have any questions or want to refine anything. I want this to be perfect for you. — Alexander Cruz`
        ]
      };

      const agentVariants = agentClosers[agentFirst] || agentClosers["Noah"];
      const closer = agentVariants[Math.floor(Math.random() * agentVariants.length)];

      // ── Before You Leave Checklist ──
      const knowledgeForChecklist = buildKnowledgeBlock({
        destination: resolvedDest,
        travelStyle: entry.trip?.travelStyle || "",
        specialRequest: entry.trip?.specialRequest || "",
        adults: entry.trip?.adults || 1,
        firstVisit: entry.trip?.firstVisit || "first"
      });

      // Generate personalised checklist from knowledge data
      const depDate = entry.trip?.departureDate || trip.departureDate || "";
      const currency = entry.trip?.currency || trip.currency || "INR";
      const destination = destProper;

      // Build smart checklist from knowledge file data
      const checklistItems = [];
      checklistItems.push(`☐ Check passport validity — must be valid for 6+ months beyond your travel date`);

      // Visa reminder based on destination
      const visaMap = {
        'dubai': `☐ Indians: visa-free 30 days — no application needed. Confirm e-Gate registration on arrival.`,
        'singapore': `☐ Indians: Singapore e-Visa (ivacsingapore.com) — SGD 30. Apply minimum 1 week ahead.`,
        'thailand': `☐ Indians: Thai e-Visa (thaievisa.go.th) — USD 35, 60 days. Apply minimum 1 week ahead.`,
        'bali': `☐ Indians: Bali Visa on Arrival USD 35 OR e-Visa at molina.imigrasi.go.id — same cost, no queue.`,
        'japan': `☐ Indians: Japan tourist visa required. Japanese Embassy/VFS. 4 weeks minimum.`,
        'uk': `☐ Indians: UK Visitor Visa required (GBP 115, separate from Schengen). Apply VFS Global 3+ weeks ahead.`,
        'france': `☐ Indians: French Schengen visa required (EUR 80). Apply at French consulate/VFS 3+ weeks ahead.`,
        'usa': `☐ Indians: US B-2 Tourist Visa required (USD 185, interview needed). Apply 6-8 weeks ahead.`,
        'maldives': `☐ Indians: Visa-free 30 days on arrival at Velana International Airport.`
      };
      const destLower = resolvedDest.toLowerCase();
      const visaReminder = Object.entries(visaMap).find(([k]) => destLower.includes(k));
      if (visaReminder) checklistItems.push(visaReminder[1]);
      else checklistItems.push(`☐ Verify visa requirements for ${destination} — check mea.gov.in`);

      // Booking reminders
      checklistItems.push(`☐ Book travel insurance (minimum ${currency === 'INR' ? 'INR 10 lakh' : 'USD 30,000'} medical coverage)`);
      checklistItems.push(`☐ Exchange small amount of local currency — enough for first transfer from airport`);
      checklistItems.push(`☐ Screenshot your hotel address to show the taxi driver on arrival`);
      checklistItems.push(`☐ Save emergency contacts offline: local police, Indian embassy, your hotel`);

      // Destination-specific items
      if (destLower.includes('dubai')) {
        checklistItems.push(`☐ Book Burj Khalifa online NOW — saves AED 80 per person vs walk-up price. burjkhalifa.ae`);
        checklistItems.push(`☐ Check UAE fines from previous visits — outstanding fines stop you at immigration. Check Dubai Police app.`);
        checklistItems.push(`☐ Download Careem app — 15-25% cheaper than metered taxis in Dubai`);
      } else if (destLower.includes('paris') || destLower.includes('france')) {
        checklistItems.push(`☐ Indians: French Schengen visa required (EUR 80). Apply VFS Global minimum 3 weeks before travel.`);
        checklistItems.push(`☐ Download Citymapper — Paris metro is the fastest way to move. Do not use taxis during peak hours.`);
        checklistItems.push(`☐ Book Louvre/Musée d'Orsay timed entry online — saves 1-2 hour queues. museedulouvre.fr`);
        checklistItems.push(`☐ Carry EUR 20-30 cash — some neighbourhood cafés and markets are cash only`);
      } else if (destLower.includes('japan') || destLower.includes('tokyo')) {
        checklistItems.push(`☐ Buy Suica IC card at airport — works on all trains, metro, buses, and 7-Eleven`);
        checklistItems.push(`☐ Carry JPY 5,000-10,000 cash — many restaurants are cash only`);
        checklistItems.push(`☐ Download Google Translate with Japanese offline — camera mode works on menus`);
      } else if (destLower.includes('bali')) {
        checklistItems.push(`☐ Photograph every scratch on scooter rental before taking it`);
        checklistItems.push(`☐ Use PT Dirgahayu for currency exchange — airport rates are 15-20% worse`);
        checklistItems.push(`☐ Pack sarong for temple visits — required, available at entrances but bring your own`);
      } else if (destLower.includes('singapore')) {
        checklistItems.push(`☐ Download Grab app — the only ride-hailing app that works reliably in Singapore`);
        checklistItems.push(`☐ Get an EZ-Link card at the airport — works on all MRT, buses, and 7-Eleven`);
      } else if (destLower.includes('bangkok') || destLower.includes('thailand')) {
        checklistItems.push(`☐ Download Grab app — metered taxis can overcharge tourists. Grab shows fixed price.`);
        checklistItems.push(`☐ Carry THB 1,000-2,000 cash — street food and tuk-tuks are cash only`);
      } else if (destLower.includes('london') || destLower.includes('uk')) {
        checklistItems.push(`☐ Download Citymapper — London tube and bus navigation`);
        checklistItems.push(`☐ Get an Oyster card at the airport — cheaper than buying single tickets every journey`);
      } else if (destLower.includes('goa')) {
        checklistItems.push(`☐ Book scooter rental in advance for peak season — INR 400/day`);
        checklistItems.push(`☐ Note which airport your flight uses — GOI (Dabolim) or GOX (Mopa) — they are 50km apart`);
      } else if (destLower.includes('maldives')) {
        checklistItems.push(`☐ Confirm your resort transfer type — speedboat vs seaplane — both depart from different terminals at Velana`);
        checklistItems.push(`☐ Carry USD cash — many resort activities and excursions are cash only`);
      } else {
        checklistItems.push(`☐ Download Google Maps with offline maps for ${destination} before you leave`);
        checklistItems.push(`☐ Research local transport app for ${destination} — Uber may not be the best option`);
      }

      const checklistContent = `☑ BEFORE YOU LEAVE FOR ${destination.toUpperCase()}\n\n${checklistItems.join('\n')}\n\n${travelerName}, every item above is specific to your trip. The checklist took 30 seconds to read. The consequences of missing any item can take days to fix.\n\n— ${agentFirst}, SKYmora Travel Team`;

      // ── What You'll Regret Missing card ──
      const k = loadDestinationKnowledge(resolvedDest);
      const regrets = k?.antiPatterns?.slice(0,3) || [];
      const neverSkip = k?.ifYouOnlyHadOneChance;
      const agentOpinion = neverSkip?.memory || neverSkip?.breakfast || neverSkip?.sunset || '';

      if (regrets.length > 0) {
        entry.days.push({
          day: totalDays + 1,
          title: "⚠️ What Most Travelers Regret",
          type: "regrets",
          content: `REGRETS\n${regrets.map(r => `• ${r}`).join('\n')}\n\nThis itinerary was specifically designed to prevent each of these.\n\n— ${agentFirst}, SKYmora Travel Team`
        });
      }

      if (agentOpinion) {
        entry.days.push({
          day: totalDays + (regrets.length > 0 ? 2 : 1),
          title: "💛 One Thing I'd Never Skip",
          type: "never-skip",
          content: `NEVER SKIP\n${agentOpinion}\n\nIf everything else fell apart — weather, delays, closures — and I could only save one experience from your ${destProper} trip, this would be it.\n\n— ${agentFirst}`
        });
      }

      entry.days.push({
        day: totalDays + (regrets.length > 0 ? 3 : 2) - (agentOpinion ? 0 : 1),
        title: "☑ Before You Leave",
        type: "checklist",
        content: checklistContent
      });

      entry.days.push({
        day: totalDays + (regrets.length > 0 ? 4 : 3) - (agentOpinion ? 0 : 1),
        title: "The SKYmora Promise",
        content: `${travelerName}, your ${totalDays}-day ${destProper} journey was built with one goal — the finest version of this trip within ${budgetDisplay}.\n\n${closer}\n\nEvery detail verified. Every cost transparent. Available through the chat below if anything needs adjusting.\n\nSafe travels.\n\n— Your SKYmora Travel Team`
      });
    }
  }
}

// ======== EXPRESS APP ========
const app = express();
app.use(express.json());

const corsOptions = {
  origin: [
    "https://skymora-travels-2.onrender.com",
    "https://skymoratravels.com",
    "https://www.skymoratravels.com",
    "http://localhost:3000",
    "http://127.0.0.1:5500"
  ],
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true
};
app.use(cors(corsOptions));

const publicPath = path.join(__dirname);
app.use(express.static(publicPath));
app.get("/", (req, res) => res.sendFile(path.join(publicPath, "index.html")));

const PORT = process.env.PORT || 3000;

// ======== GENERATE ENDPOINT ========
app.post("/api/generate", async (req, res) => {
  const trip = req.body || {};
  const totalDays = trip.tripDays ?? 5;
  const tripId = generateTripId(trip.name);

  console.log(`🚀 SKYmora: ${trip.name} → ${trip.destination} | ${trip.currency}${trip.budget} | ${totalDays} days`);
  console.log(`🪶 Trip ID: ${tripId}`);

  // ── Real-time current reality check ──
  // Checks for live travel advisories, safety alerts, disruptions before generating
  let currentReality = null;
  try {
    currentReality = await checkCurrentReality(trip.destination || "", "India");
    if (currentReality?.hasAlerts) {
      console.log(`⚠️  Current alerts found for ${trip.destination}: ${currentReality.alerts.length} alert(s)`);
      // Store on trip object so it gets injected into prompts
      trip._currentAlerts = currentReality.alerts;
    } else {
      console.log(`✅ No current alerts for ${trip.destination}`);
    }
  } catch(e) {
    console.warn("⚠️ Reality check failed (non-blocking):", e.message);
  }

  const validation = validateTrip(trip);
  console.log(`🧠 SKYmora Intelligence — Persona: ${validation.persona} | Tier: ${validation.tier} | Feasible: ${validation.feasible} | Comfort: ${validation.comfortScore}% | DNA: ${validation.experienceDNA} | Type: ${validation.message?.type}`);

  if (!validation.feasible) {
    console.log(`❌ Trip not feasible — returning warm rejection`);
    const rejectionContent = buildRejectionItinerary(validation, trip);
    const rejectionDay = {
      day: 1, title: validation.message.headline,
      content: rejectionContent, isRejection: true
    };
    await saveBackup({ type: "rejection", tripId, trip, reason: validation.message.type });
    await saveMemory(tripId, trip);
    return res.json({
      success: true, tripId, partial: false, complete: true,
      itinerary: [rejectionDay], totalDays: 1, validation: validation.message
    });
  }

  const resolvedDest = resolveDestinationCity(trip.destination || "");
  const destProper = resolvedDest.split(" ").map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(" ");
  const heroCard = {
    day: 0,
    type: "hero",
    title: destProper,
    content: `${trip.tripDays} days designed around slower mornings, local food, and room to wander.`,
    resolvedDestination: resolvedDest
  };
const rawName = trip.nickname || trip.name?.split(" ")[0] || "Friend";
  const travelerName = rawName.charAt(0).toUpperCase() + rawName.slice(1).toLowerCase();
  const assignedAgentName = trip.agentData?.name || "Olivia Chen";
  const agentFirstName = assignedAgentName.split(" ")[0];

  const introClosers = {
    "Olivia": [
      `${travelerName}, I put genuine thought into every detail of this journey — your pace, your budget, the way you like to experience a place. This is not a template. This is ${destProper}, planned specifically for you.\n\nIf anything feels off — a different neighbourhood, a different restaurant, a change in timing — I am right here. The chat is just below and I would genuinely love to make this perfect for you.\n\n— Olivia Chen`,
      `${travelerName}, crafting this itinerary was a pleasure. Every choice — the property, the restaurants, the route through the city — was made with you specifically in mind.\n\nNo question is too small. If something needs adjusting before you travel, please reach out through the chat below. I am waiting and happy to help.\n\n— Olivia Chen`,
      `${travelerName}, this is your ${destProper} — ${trip.tripDays} days designed around exactly how you travel. Every price is real, every recommendation has a reason, and nothing was left to chance.\n\nI would love to hear from you if anything needs a tweak. The chat below is open and I am genuinely eager to make this the best possible version of your trip.\n\n— Olivia Chen`,
      `${travelerName}, the best journeys are the ones that feel personal from the very first day. That is exactly what I tried to create for you here.\n\nIf you have any questions, any changes in mind, or simply want to talk through the plan — please reach out through the chat below. I am here and I want this trip to be everything you are hoping for.\n\n— Olivia Chen`,
      `${travelerName}, every traveler deserves a journey that feels made for them. I hope this one does.\n\nThe chat below is open — whether it is a small change or a big one, I am here and genuinely looking forward to hearing from you. Let us make this perfect together.\n\n— Olivia Chen`,
      `${travelerName}, this plan took care and attention to build. ${destProper} rewards the traveler who goes in prepared, and you are prepared.\n\nAnything you want to change or explore further — I am right below in the chat. I am here for exactly this.\n\n— Olivia Chen`
    ],
    "Emma": [
      `${travelerName}, I built this journey to prove that a well-planned trip does not need to feel like a compromise. Every choice here delivers more than its price suggests — that was the goal from the very start.\n\nIf anything needs changing, please reach out through the chat below. I am genuinely excited to help you refine this further.\n\n— Emma Collins`,
      `${travelerName}, your budget was not a limitation here. It was a challenge I took personally. Every recommendation was chosen to make your money work as hard as possible without sacrificing a single moment.\n\nI would love to hear from you if you want to adjust anything. The chat is just below and I am ready and waiting.\n\n— Emma Collins`,
      `${travelerName}, this is ${destProper} done properly — not expensively, but properly. There is a difference and this plan understands it.\n\nIf something does not feel right or you want to explore a different direction, I am here. Chat below anytime. I genuinely want this trip to exceed your expectations.\n\n— Emma Collins`,
      `${travelerName}, I planned this the way I would plan it for someone whose money I was spending myself — carefully, deliberately, without a single wasted choice.\n\nThe chat below is open and I am eager to hear from you. Any question, any change, any idea — bring it to me.\n\n— Emma Collins`,
      `${travelerName}, the best feeling in travel planning is when a traveler realises they got far more than they expected. That is exactly what I built this for.\n\nPlease reach out through the chat below if anything needs adjusting. I am here, I am enthusiastic, and I want to make this perfect for you.\n\n— Emma Collins`,
      `${travelerName}, every price in this plan was verified, every option was compared, and every choice was made with your experience in mind — not just your budget.\n\nIf you want to talk through anything or make any changes before you travel, the chat is right below. I would love to hear from you.\n\n— Emma Collins`
    ],
    "Ethan": [
      `${travelerName}, this plan was built with energy and purpose — every day designed to give you something real, something that pushes slightly beyond the ordinary.\n\nIf you want to add more edge or simply have questions before you go — I am right here in the chat below. I am genuinely excited about this trip for you.\n\n— Ethan Roberts`,
      `${travelerName}, ${destProper} rewards the traveler who goes in with a plan and the confidence to follow it. You have both now.\n\nIf anything feels like it needs more intensity or a different direction — the chat is below and I am ready to dig in with you. Let us make this exactly what you want.\n\n— Ethan Roberts`,
      `${travelerName}, I built this itinerary around the belief that the best travel moments are the ones that required something from you. This plan has those built in.\n\nAnything you want to adjust — reach out through the chat below. I am here and genuinely looking forward to talking this through with you.\n\n— Ethan Roberts`,
      `${travelerName}, ${trip.tripDays} days in ${destProper} — planned with zero wasted hours and maximum experience at every turn.\n\nIf you want to push the plan further or have any questions, I am just below in the chat. I love refining a good itinerary.\n\n— Ethan Roberts`,
      `${travelerName}, the traveler who goes in prepared always gets more out of a destination. This plan makes sure you are that traveler.\n\nThe chat below is open — any changes, any questions, anything you want to add. I am here and eager to help.\n\n— Ethan Roberts`,
      `${travelerName}, I planned this with intention, energy, and you at the centre of every decision.\n\nIf anything needs changing before you travel, please reach out through the chat below. I am waiting and genuinely excited to make this even better for you.\n\n— Ethan Roberts`
    ],
    "Sophia": [
      `${travelerName}, precision is the only standard I work to. Every choice in this itinerary — every property, every restaurant, every route — was the strongest available option within your parameters.\n\nIf anything needs refining before you travel, the chat below is open and I would be genuinely pleased to make this exactly right for you.\n\n— Sophia Bennett`,
      `${travelerName}, this is ${destProper} at the level it deserves to be experienced. Nothing in this plan is accidental and nothing is generic.\n\nIf you have questions or want to explore adjustments, please reach out through the chat below. I care deeply about getting this right for you.\n\n— Sophia Bennett`,
      `${travelerName}, the difference between a good trip and the right trip is in the details. I have taken care of the details.\n\nThe chat below is open — any question, any refinement, any idea you have. I am waiting and genuinely looking forward to hearing from you.\n\n— Sophia Bennett`,
      `${travelerName}, I do not do generic. Every recommendation in this plan earned its place — compared, verified, and chosen for a specific reason.\n\nIf anything needs adjusting before you travel, please do not hesitate to reach out through the chat below. I am here for exactly this.\n\n— Sophia Bennett`,
      `${travelerName}, ${trip.tripDays} days in ${destProper} — curated with the care this destination deserves and the attention your journey requires.\n\nThe chat is just below and I would genuinely love to hear from you if anything needs to change.\n\n— Sophia Bennett`,
      `${travelerName}, this plan reflects a standard I hold myself to — nothing included by default, everything chosen with purpose.\n\nPlease reach out through the chat below if you have any questions. I am here, I am ready, and I want this to be perfect for you.\n\n— Sophia Bennett`
    ],
    "Noah": [
      `${travelerName}, I have planned journeys for every kind of traveler and every kind of destination. This one was built around exactly how you travel — your pace, your style, your budget.\n\nThe chat below is open and I would genuinely love to hear from you if anything needs adjusting. I am here and ready to help.\n\n— Noah Davis`,
      `${travelerName}, the best travel plans feel personal because they are. This one was built for you specifically — not adapted from a template, not generated from a formula.\n\nIf you have questions or want to make changes, please reach out through the chat below. I am genuinely eager to help.\n\n— Noah Davis`,
      `${travelerName}, ${destProper} has something remarkable to offer every traveler who comes prepared. This plan makes sure you are prepared.\n\nAnything needs changing or you simply want to talk through the details — I am just below in the chat.\n\n— Noah Davis`,
      `${travelerName}, I built this with care and without assumptions. Every choice was made with your specific journey in mind.\n\nThe chat below is open — any question, any change, any idea you have. I am here and looking forward to hearing from you.\n\n— Noah Davis`,
      `${travelerName}, travel is personal. Planning should be too. That is exactly the approach I took with this itinerary.\n\nIf anything feels like it needs a different direction, please reach out through the chat below. I am ready and genuinely happy to help.\n\n— Noah Davis`,
      `${travelerName}, ${trip.tripDays} days in ${destProper} — planned with flexibility, purpose, and you at the centre of every decision.\n\nThe chat is right below and I am waiting. Any question, any change — bring it to me.\n\n— Noah Davis`
    ],
    "Liam": [
      `${travelerName}, culture is not something you observe on this trip — it is something you step into. Every recommendation was chosen to take you deeper than the surface of ${destProper}.\n\nIf you want to explore a different angle or have any questions, please reach out through the chat below. I am genuinely excited about this journey for you.\n\n— Liam Patel`,
      `${travelerName}, the real ${destProper} is not always the one in the guidebooks. This plan knows the difference.\n\nThe chat below is open — any questions, any changes, anything you want to add. I would genuinely love to hear from you before you travel.\n\n— Liam Patel`,
      `${travelerName}, I built this itinerary around the belief that the most meaningful travel experiences come from going deeper, not just further.\n\nIf anything needs adjusting, please reach out through the chat below. I am here and eager to help make this perfect.\n\n— Liam Patel`,
      `${travelerName}, ${trip.tripDays} days in ${destProper} — planned around the experiences that stay with you long after you come home.\n\nThe chat is just below and I am waiting. Any question, any idea, any change — reach out.\n\n— Liam Patel`,
      `${travelerName}, every destination has a version that most travelers miss entirely. This plan makes sure you do not miss it.\n\nIf you have questions or want to explore any adjustments, please reach out through the chat below. I am genuinely looking forward to hearing from you.\n\n— Liam Patel`,
      `${travelerName}, I planned this with the curiosity of someone who loves ${destProper} and the care of someone who wants you to love it too.\n\nThe chat below is open — please do not hesitate to reach out. Any change, any question. I am here and ready.\n\n— Liam Patel`
    ],
    "Alexander": [
      `${travelerName}, elite travel is not about spending more — it is about experiencing more of what actually matters. Every choice in this plan reflects that.\n\nIf anything needs refining before you travel, the chat below is open and I would be honoured to make this exactly right for you.\n\n— Alexander Cruz`,
      `${travelerName}, this is ${destProper} at the highest level available within your parameters. Nothing was left to chance and nothing was chosen by default.\n\nPlease reach out through the chat below if you want to explore any adjustments. I am genuinely invested in making this extraordinary for you.\n\n— Alexander Cruz`,
      `${travelerName}, the finest journeys are the ones where every detail has been considered before you arrive. That is what I have done here.\n\nThe chat is open below — any question, any refinement. I am waiting and looking forward to hearing from you.\n\n— Alexander Cruz`,
      `${travelerName}, I curate experiences for travelers who expect the best and understand the difference when they experience it. This plan was built with you in mind.\n\nIf anything needs changing before you travel, please reach out through the chat below. I am here for exactly this.\n\n— Alexander Cruz`,
      `${travelerName}, ${trip.tripDays} days in ${destProper} — every element selected for maximum impact, minimum friction, and the kind of experience that stays with you.\n\nThe chat is just below. I am here and genuinely eager to hear from you.\n\n— Alexander Cruz`,
      `${travelerName}, excellence is a standard, not an aspiration. This plan reflects that standard.\n\nPlease reach out through the chat below if you have any questions or want to refine anything. I want this to be perfect for you.\n\n— Alexander Cruz`
    ]
  };

  const introVariants = introClosers[agentFirstName] || introClosers["Noah"];
  const introMessage = introVariants[Math.floor(Math.random() * introVariants.length)];

  const introCard = {
    day: 0,
    type: "intro",
    content: introMessage,
    agentName: assignedAgentName
  };

  // ── Stage 1: Planning Engine — make all decisions before writing ──
  const knowledgeBlockForPlanning = buildKnowledgeBlock({
    destination: resolvedDest,
    travelStyle: trip.travelStyle || "",
    specialRequest: trip.specialRequest || "",
    adults: trip.adults || 1,
    children: trip.children || 0,
    firstVisit: trip.firstVisit || "first",
    budget: trip.budget || 0,
    currency: trip.currency || "USD"
  });
  const tripPlan = await planTrip(trip, knowledgeBlockForPlanning);
  if (tripPlan) {
    console.log(`📋 Trip plan ready — persona: ${tripPlan.persona}, visit: ${tripPlan.visitType}`);
  }

  // ── Stage 2: Write Day 1 using the locked plan ──
  const day1 = await buildDay(trip, 1, tripPlan);
  itineraries.set(tripId, {
    days: [introCard, day1], lastSentIndex: 2,
    complete: 1 === totalDays, totalDays, trip,
    tripPlan  // store plan for background days
  });

  if (totalDays > 1) generateInBackground(tripId, trip, 1, totalDays, tripPlan);

  await saveBackup({ type: "itinerary", tripId, trip });
  await saveMemory(tripId, trip);

  res.json({ success: true, tripId, partial: true, itinerary: [introCard, day1], totalDays });
});

// ======== PROGRESS ENDPOINT ========
app.get("/api/progress/:tripId", async (req, res) => {
  const entry = itineraries.get(req.params.tripId);
  if (!entry) return res.status(404).json({ success: false, error: "Trip not found" });
  const { days, lastSentIndex, complete } = entry;
  const newDays = days.slice(lastSentIndex);
  entry.lastSentIndex = days.length;
  res.json({ success: true, newDays, complete, totalDays: entry.totalDays, currentCount: days.length });
});

// ======== FEASIBILITY HELPERS ========
function evaluateTripFeasibility(budget, currency, days, destination) {
  const normalizedCurrency = currency?.toUpperCase() || "USD";
  const perDay = (Number(budget) || 0) / (days || 1);
  const minThresholds = {
    INR: { local: 1500, domestic: 3000, international: 9000 },
    USD: { local: 50, domestic: 120, international: 250 },
    EUR: { local: 45, domestic: 100, international: 220 },
    GBP: { local: 40, domestic: 90, international: 200 },
    AED: { local: 150, domestic: 350, international: 800 }
  };
  const base = minThresholds[normalizedCurrency] || minThresholds.USD;
  if (perDay < base.local) return { possible: false, region: "local", reason: `${days}-day trip to ${destination} with ${currency} ${budget} is below minimum travel cost.` };
  if (perDay < base.domestic) return { possible: "very tight", region: "local", reason: "Tight budget — nearby regional trip recommended." };
  if (perDay < base.international) return { possible: "domestic", region: "domestic", reason: "Strong domestic travel budget." };
  return { possible: true, region: "international", reason: "Budget suitable for international travel." };
}

function getFeasibilityMessage(traveler, destination, budget, currency, days) {
  const evalResult = evaluateTripFeasibility(budget, currency, days, destination);
  if (evalResult.possible === false) return `${traveler}, a ${days}-day trip to ${destination} with ${currency} ${budget} is not practically achievable. I can design a strong nearby alternative that works well — shall I?`;
  if (evalResult.possible === "very tight") return `${traveler}, ${currency} ${budget} makes ${destination} difficult, but I can build something worthwhile nearby.`;
  return null;
}

function getTravelerProfile(tripId) {
  const trip = memoryDB.data.trips.find(t => t.tripId === tripId);
  if (!trip) return {};
  return { name: trip.traveler, destination: trip.destination, budget: trip.budget, currency: trip.currency, days: trip.days, lastUpdated: trip.updatedAt || new Date().toISOString() };
}

async function updateTravelerPreferences(tripId, updates = {}) {
  const trip = memoryDB.data.trips.find(t => t.tripId === tripId);
  if (trip) { Object.assign(trip, updates); trip.lastUpdated = new Date().toISOString(); await memoryDB.write(); }
}

// ======== CACHE HELPERS ========
let promptCache = new Map();

function getCachedResponse(key) {
  if (!promptCache.has(key)) return null;
  const entry = promptCache.get(key);
  if (Date.now() - entry.timestamp > 1000 * 20) { promptCache.delete(key); return null; }
  return entry.response;
}

function setCachedResponse(key, response) {
  promptCache.set(key, { response, timestamp: Date.now() });
}

async function streamResponse(res, text, delayMs = 8) {
  res.lastResponse = text;
  for (const char of text) {
    res.write(`data: ${JSON.stringify({ token: char })}\n\n`);
    if (delayMs) await new Promise(r => setTimeout(r, delayMs));
  }
}

function scheduleItineraryUpdate(tripId, tripData, updates = {}, forceFullRegen = false) {
  setTimeout(async () => {
    try {
      const updatedTrip = { ...tripData, ...updates, lastUpdated: new Date().toISOString() };
      if (tripId) await saveMemory(tripId, updatedTrip);
      const day1 = await buildDay(updatedTrip, 1);
      const id = tripId || generateTripId(updatedTrip.name);
      itineraries.set(id, { days: [day1], lastSentIndex: 1, complete: false, totalDays: updatedTrip.tripDays, trip: updatedTrip });
      if (updatedTrip.tripDays > 1 || forceFullRegen) generateInBackground(id, updatedTrip, 1, updatedTrip.tripDays);
      console.log(`✅ Itinerary updated for ${id}`);
    } catch (err) { console.error("❌ Background update failed:", err); }
  }, 100);
}

// ======== TRINITY BRAIN ========
async function handleUnifiedChat(message, tripData, conversationHistory, tripId, getChatHistory, saveChatMessage) {
  const userText = (message || "").trim();
  const cacheKey = `${tripId}::${userText}`;
  const cached = getCachedResponse(cacheKey);
  if (cached) { console.log("⚡ Cached response"); return { mode: "plain", text: cached }; }
  if (!userText) return { mode: "plain", text: "Tell me more about your trip — destination, dates, or budget." };

  const routerPrompt = `Traveler message: "${userText}"\nDecide: Smart (itinerary/planning) | Perfect (emotional/warm) | Ultra (live data/weather)\nRespond only: { "brain": "Smart" | "Perfect" | "Ultra" }`;

  let brain = "Smart";
  try {
    const decision = await openai.chat.completions.create({
      model: "gpt-4o-mini", response_format: { type: "json_object" }, temperature: 0, max_tokens: 20,
      messages: [{ role: "system", content: "Return only JSON." }, { role: "user", content: routerPrompt }]
    });
    const raw = decision?.choices?.[0]?.message?.content;
    if (raw) { const parsed = JSON.parse(raw); brain = parsed.brain || "Smart"; }
  } catch (e) { console.warn("Router failed:", e?.message); brain = "Smart"; }

  console.log(`🧭 Trinity Brain: ${brain}`);

  if (brain === "Ultra") {
    const ultra = await runUltraProgrammatic(userText, tripData, conversationHistory, tripId, getChatHistory, saveChatMessage);
    return { mode: "plain", text: ultra.text || ultra };
  }
  if (brain === "Perfect") {
    const perfect = await runPerfectProgrammatic(userText, tripData, conversationHistory, tripId, getChatHistory, saveChatMessage);
    return { mode: "plain", text: perfect.text || perfect };
  }

  const smartConfig = await handleIntelligentChat(userText, tripData, conversationHistory, tripId, getChatHistory, saveChatMessage);
  if (smartConfig?.stream === true) return { mode: "openai_stream", chatConfig: smartConfig };
  if (smartConfig?.messages) return { mode: "messages", messages: smartConfig.messages };
  return { mode: "plain", text: "Let's continue planning — what would you like to adjust?" };
}

// ======== MEMORY ENDPOINTS ========
app.get("/api/memory", async (req, res) => {
  try { await memoryDB.read(); res.json({ success: true, data: memoryDB.data }); }
  catch (err) { res.status(500).json({ success: false, error: err?.message }); }
});

app.get("/api/trip/:tripId", async (req, res) => {
  try {
    const trip = getMemory(req.params.tripId);
    if (trip) res.json({ success: true, data: trip });
    else res.status(404).json({ success: false, error: "Trip not found" });
  } catch (err) { res.status(500).json({ success: false, error: err?.message }); }
});

app.get("/api/chat-history/:tripId", async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 50;
    res.json({ success: true, data: getChatHistory(req.params.tripId, limit) });
  } catch (err) { res.status(500).json({ success: false, error: err?.message }); }
});

setupPerfectChat(app);
setupUltraChat(app);
setupAgentRoutesLite(app, memoryDB);

app.get("/api/conversations", async (req, res) => {
  await memoryDB.read();
  res.json({ success: true, data: memoryDB.data.conversations });
});

app.get("/api/conversation/:tripId", async (req, res) => {
  try { await memoryDB.read(); res.json({ success: true, data: getOrCreateConversation(req.params.tripId) }); }
  catch (err) { res.status(500).json({ error: err.message }); }
});

app.post("/api/assign-agent", async (req, res) => {
  try {
    const { tripId, agentName } = req.body;
    if (!tripId || !agentName) return res.status(400).json({ error: "Missing tripId or agentName" });
    const convo = getOrCreateConversation(tripId);
    convo.assignedAgent = agentName; convo.status = "assigned"; convo.lastUpdated = new Date().toISOString();
    convo.messages.push({ id: uuidv4(), role: "system", content: `${agentName} joined the chat`, timestamp: new Date().toISOString(), seen: false });
    await memoryDB.write();
    if (global.io) global.io.to(tripId).emit("agentAssigned", { agentName });
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post("/api/agent-reply", async (req, res) => {
  try {
    const { tripId, message, agentName } = req.body;
    if (!tripId || !message) return res.status(400).json({ error: "Missing tripId or message" });
    const convo = getOrCreateConversation(tripId);
    convo.messages.push({ id: uuidv4(), role: "agent", agentName: agentName || "Agent", content: message, timestamp: new Date().toISOString(), edited: false, seen: false });
    convo.lastUpdated = new Date().toISOString();
    await memoryDB.write();
    if (global.io) global.io.to(tripId).emit("newMessage", { role: "agent", content: message, agentName: agentName || "Agent" });
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ======== CHAT ENDPOINT ========
app.post("/api/chat-trinity", async (req, res) => {
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");

  const { message, tripData = {}, conversationHistory = [] } = req.body;
  const tripId = tripData?.tripId || "default";
  const cacheKey = `${tripId}::${message}`;

  const fw = classifyMessage(message, tripData);

  if (fw.action !== "allow") {
    const reply = fw.reply || "I can only assist with travel-related queries.";
    await saveChatMessage(tripId, "assistant", reply);
    res.write(`data: ${JSON.stringify({ token: reply })}\n\n`);
    res.write("data: [DONE]\n\n");
    return res.end();
  }

  if (fw.action === "inappropriate" || fw.action === "redirect") {
    const reply = fw.reply;
    await saveChatMessage(tripId, "assistant", reply);
    res.write(`data: ${JSON.stringify({ token: reply })}\n\n`);
    res.write("data: [DONE]\n\n");
    return res.end();
  }

  if (fw.reply && fw.action !== "allow") {
    const reply = fw.reply;
    await saveChatMessage(tripId, "assistant", reply);
    res.write(`data: ${JSON.stringify({ token: reply })}\n\n`);
    res.write("data: [DONE]\n\n");
    return res.end();
  }

  await saveChatMessage(tripId, "user", message);
  if (global.io) global.io.to(tripId).emit("newMessage", { role: "user", content: message, timestamp: new Date().toISOString() });

  await memoryDB.read();
  const convo = memoryDB.data.conversations.find(c => c.tripId === tripId);

  if (convo?.mode === MODES.TAKEOVER) {
    if (convo.pendingDraft) { cancelDraftTimer(tripId); convo.pendingDraft = null; await memoryDB.write(); }
    const reply = `Your travel expert ${convo.assignedAgent || "from SKYmora"} is handling your request. They will reply shortly.`;
    await saveChatMessage(tripId, "assistant", reply);
    res.write(`data: ${JSON.stringify({ token: reply })}\n\n`);
    res.write("data: [DONE]\n\n");
    return res.end();
  }

  if (convo?.mode === MODES.REVIEW && convo?.assignedAgent) {
    const result = await handleUnifiedChat(message, tripData, conversationHistory, tripId, (id, limit) => getChatHistory(id, limit), (id, role, content) => saveChatMessage(id, role, content));
    let aiText = "";
    if (result.mode === "plain") aiText = result.text || "";
    else if (result.mode === "messages") aiText = result.messages?.[0]?.content || "";
    else if (result.mode === "openai_stream") {
      const stream = await openai.chat.completions.create({ model: result.chatConfig.model || MODEL, messages: result.chatConfig.messages, stream: true, temperature: result.chatConfig.temperature ?? 0.8, max_tokens: result.chatConfig.max_tokens ?? 450 });
      for await (const chunk of stream) { const token = chunk.choices?.[0]?.delta?.content; if (token) aiText += token; }
    }
    if (!aiText) aiText = "Let me help you with that.";
    await holdDraft(convo, aiText, memoryDB);
    if (global.io && convo.assignedAgent) global.io.to(`agent_${convo.assignedAgent}`).emit("aiDraft", { tripId, draft: aiText });
    const holdMsg = "Let me check the best options and get back to you shortly.";
    await saveChatMessage(tripId, "assistant", holdMsg);
    res.write(`data: ${JSON.stringify({ token: holdMsg })}\n\n`);
    res.write("data: [DONE]\n\n");
    return res.end();
  }

  const result = await handleUnifiedChat(message, tripData, conversationHistory, tripId, (id, limit) => getChatHistory(id, limit), (id, role, content) => saveChatMessage(id, role, content));

  if (result.mode === "plain") {
    const reply = result.text;
    await saveChatMessage(tripId, "assistant", reply);
    res.write(`data: ${JSON.stringify({ token: reply })}\n\n`);
    res.write("data: [DONE]\n\n");
    setCachedResponse(cacheKey, reply);
    return res.end();
  }

  if (result.mode === "messages") {
    const reply = result.messages?.[0]?.content || "Here is something helpful.";
    await saveChatMessage(tripId, "assistant", reply);
    res.write(`data: ${JSON.stringify({ token: reply })}\n\n`);
    res.write("data: [DONE]\n\n");
    setCachedResponse(cacheKey, reply);
    return res.end();
  }

  if (result.mode === "openai_stream") {
    const streamConfig = result.chatConfig;
    const completion = await openai.chat.completions.create({
      model: streamConfig.model || MODEL, messages: streamConfig.messages, stream: true,
      temperature: streamConfig.temperature ?? 0.8, max_tokens: streamConfig.max_tokens ?? 450,
      presence_penalty: streamConfig.presence_penalty ?? 0.2, frequency_penalty: streamConfig.frequency_penalty ?? 0.3
    });
    let buffer = "";
    for await (const chunk of completion) {
      const token = chunk.choices?.[0]?.delta?.content;
      if (token) { buffer += token; res.write(`data: ${JSON.stringify({ token })}\n\n`); }
    }
    await saveChatMessage(tripId, "assistant", buffer);
    res.write("data: [DONE]\n\n");
    setCachedResponse(cacheKey, buffer);
    return res.end();
  }

  const fallback = "I am here to help — tell me about your trip.";
  await saveChatMessage(tripId, "assistant", fallback);
  res.write(`data: ${JSON.stringify({ token: fallback })}\n\n`);
  res.write("data: [DONE]\n\n");
  return res.end();
});

app.post("/api/chat", (req, res, next) => { req.url = "/api/chat-trinity"; app._router.handle(req, res, next); });

// ======== SERVER ========
import http from "http";
import { Server } from "socket.io";

const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*" } });
global.io = io;

io.on("connection", (socket) => {
  console.log("🔌 User connected:", socket.id);
  socket.on("joinTrip", (tripId) => { socket.join(tripId); console.log(`👤 Joined room: ${tripId}`); });
  socket.on("joinAgentRoom", (agentName) => { socket.join(`agent_${agentName}`); console.log(`🧑‍💼 Agent room: agent_${agentName}`); });
  socket.on("agentTyping", ({ tripId, agentName, isTyping }) => { socket.to(tripId).emit("agentTyping", { agentName, isTyping }); });
  socket.on("disconnect", () => { console.log("❌ Disconnected:", socket.id); });
});

server.listen(PORT, () => { console.log(`🚀 SKYmora INTELLIGENCE ENGINE on http://localhost:${PORT}`); });