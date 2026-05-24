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
import { needsLiveSearch, performLiveSearch } from "./skymora-live-search.js";
import { runUltraProgrammatic, setupUltraChat } from "./skymora-ultra-chat.js";
import { classifyMessage } from "./skymora-firewall.js";
import { validateTrip, buildRejectionItinerary } from "./skymora-validator.js";
import { getDestinationPhoto } from "./skymora-photos.js";
import { MODES } from "./agent-system-lite.js";
import { holdDraft, cancelDraftTimer } from "./agent-draft-lite.js";
import { setupAgentRoutesLite } from "./agent-routes-lite.js";

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
dotenv.config({ override: true });

console.log("🔑 OpenAI Key Loaded:", !!process.env.OPENAI_API_KEY);
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

// ======== NARRATIVE POLISHER — WORLD CLASS TONE ========
function narrativePolish(rawText, travelerName, destination, persona = "explorer", day = 1, totalDays = 1) {
  if (!rawText) return rawText;
  let text = rawText;

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

// ======== BUILD DAY — COMPLETE INTELLIGENCE ENGINE ========
async function buildDay(trip, day) {
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
  const dailyBudget = Math.round(budget / totalDays);

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

  // Energy guide per day position
  const energyGuide = isDay1
    ? `Arrival day. Keep it gentle. Airport → property → first impressions only. One landmark maximum. Light dinner. Early night.`
    : day === totalDays
    ? `Departure day. Slow and meaningful. One final spot. Unhurried departure preparation.`
    : `Full exploration day. Morning: highest energy, best attraction. Afternoon: neighborhoods, local life. Evening: best dinner, emotional peak.`;

  // Persona writing voice
  const personaVoice = {
    luxury: "Refined and restrained. Demonstrate quality through specific details — never say the word 'luxury'. Focus on precision, exclusivity, being looked after well.",
    couple: "Romantic framing. Table-for-two settings, sunset timing, slow evenings. Write as if you genuinely want them to fall deeper in love on this trip.",
    photographer: "Specific golden hour times. Light quality descriptions. Best angles. One unexpected location most tourists miss.",
    foodie: "Every meal is an event. Describe the actual dish, not just the restaurant. One market or street food moment per day.",
    family: "Honest about child energy. Rest points built in. Child pricing noted. Best family memories happen in small unexpected moments.",
    solo: "Intelligent and intentional. One social opportunity per day. Safety noted naturally not alarmingly.",
    adventurer: "Physical energy language. Effort-to-reward ratios. One route or perspective guidebooks miss.",
    explorer: "One thing only residents know. Like a well-traveled friend, not a guidebook."
  };

  const voiceInstruction = personaVoice[personaMap] || personaVoice.explorer;

  // Local intelligence lines — specific to destination type
  const localIntelligence = isDay1 ? `
Include one LOCAL INTELLIGENCE observation that makes SKYmora feel like an insider, not a generator.
Examples of the tone:
- "Most visitors stay near Times Square. There is no good reason to."
- "The subway is faster than any taxi after 9am. This matters more than it sounds."
- "The property we selected sits in a neighborhood where locals still outnumber tourists."
This observation should feel like something only someone who has been there many times would say.` : `
Include one LOCAL INTELLIGENCE line — a specific observation about this destination that feels genuinely insider.`;

  const prompt = `You are a senior travel consultant at SKYmora with 15 years of personal experience in ${resolvedDestination}.

You are writing Day ${day} of ${totalDays} for ${travelerName}.

TRAVELER PROFILE:
Name: ${travelerName} | Route: ${departure} (${depCode}) → ${resolvedDestination} (${destCode})
Date: ${departureDate} | Group: ${adults} adult(s)${children ? `, ${children} children` : ""}${infants ? `, ${infants} infants` : ""}
Budget: ${sym}${budget} total | ${sym}${dailyBudget}/day
Travel Style: ${travelStyle || "balanced"} | Special Request: ${specialRequest || "none"}
Persona: ${personaMap}

${context}

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

${localIntelligence}

FAKE URGENCY — completely banned:
Never say: "books out fast", "selling quickly", "limited availability"
Instead inform intelligently: "Current pricing on this route is strong for the season. Midweek dates tend to perform better if flexibility exists."

=== SECTION FORMAT ===
Break the day into named sections. Each section:
- - Header: SECTION NAME (no brackets, no emojis in headers)
- 1-2 sentences MAXIMUM per section — no exceptions
- One hard specific fact per section (exact price, exact time, exact name)
- One blank line between sections
- Write like a senior advisor speaking to an intelligent traveler — not a narrator
- EVERY day must use sections — Day 2 and middle days are NOT exempt
- Never write continuous paragraphs — always break into named sections
SECTIONS FOR DAY ${isDay1 ? `1:
LEAVING ${departure.toUpperCase()}
YOUR FLIGHT
ARRIVING IN ${resolvedDestination.toUpperCase()}
GETTING TO THE CITY
YOUR STAY
FIRST EVENING
ONE THING TO KNOW` : day === totalDays ? `${day}:
FINAL MORNING
LAST BREAKFAST
ONE MORE THING
HEADING HOME
FAREWELL` : `${day}:
MORNING
THE MAIN EXPERIENCE
LUNCH
AFTERNOON
EVENING
DINNER`}

AGENT SIGNATURE — end every day card with:
"Prepared for ${travelerName} — ${agentFirstName}, SKYmora Travel Team"
RULES:
- Maximum 2 emojis in the ENTIRE day card content
- Each section maximum 4 sentences
- Address ${travelerName} by name once — opening line only
- Use ONLY real names and prices from Google data above
- Title must be specific: "Day 1: Arrival in ${resolvedDestination}" not "Day 1: ${resolvedDestination}"
- Airport codes in content: ${depCode} → ${destCode}

Return ONLY this JSON:
{
  "day": ${day},
  "title": "Day ${day}: [Specific Title]",
  "content": "[Full sectioned content as described above]",
  "dailyCost": [number],
  "budgetStatus": "Within budget",
  "depCode": "${depCode}",
  "destCode": "${destCode}"
}`;

  try {
    console.log(`🖊️ Writing Day ${day} for ${travelerName} [${personaMap}]...`);

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      response_format: { type: "json_object" },
      temperature: 0.72,
      max_tokens: 3000,
      messages: [
        {
          role: "system",
          content: `You are an elite travel writer at SKYmora. Your writing is precise, human, and intelligent.
Never use these words: vibrant, nestled, charming, unforgettable, extraordinary, delightful, immersive, enchanting, magical, breathtaking, stunning, incredible, amazing, wonderful, fantastic, luxurious, picturesque, serene, tranquil.
Every section header must be plain text — no brackets, no emojis.
Every major recommendation must include WHY that specific option was chosen.
Pricing must feel like intelligent market analysis, never pressure.
Return valid JSON with a "content" field.`
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
async function generateInBackground(tripId, trip, startAt, totalDays) {
  const entry = itineraries.get(tripId);
  if (!entry) return;

  for (let d = startAt + 1; d <= totalDays; d++) {
    await new Promise(r => setTimeout(r, 3000));
    const dayObj = await buildDay(trip, d);
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

      const promiseClosers = {
        luxury: `Every property, every restaurant, every experience was chosen for one reason — it is the strongest option available within your parameters. Nothing generic. This is ${destProper} at the level it deserves to be experienced.`,
        couple: `Every detail was built with the two of you in mind. Restaurants chosen for intimacy. Timings set for the right light. Pace designed so you are never rushed through the moments that matter. ${destProper} is waiting.`,
        photographer: `Every location was chosen with light quality, timing, and visual impact in mind. Routes planned so the best shots happen at the best hours. ${destProper} through your lens.`,
        foodie: `Every restaurant was chosen because it delivers something real at its price point. Not famous — real. The difference matters, and you will taste it from Day 1.`,
        family: `Every day was paced for the whole family. Energy preserved for evenings. Rest built into afternoons. The moments that become family stories happen when nobody is exhausted.`,
        solo: `This journey was planned for someone who travels with intention. Every recommendation assumes you know what you are doing and want to do it well.`,
        adventurer: `Every day pushes slightly beyond comfortable. Not recklessly — purposefully. The experiences that become stories are the ones that required something from you.`,
        explorer: `Every price is real. Every restaurant chosen for what it delivers at that cost. Every property fits your budget without compromising the experience. This is ${destProper} — planned carefully.`
      };

      const closer = promiseClosers[persona] || promiseClosers.explorer;

      entry.days.push({
        day: totalDays + 1,
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

  const day1 = await buildDay(trip, 1);
  itineraries.set(tripId, {
    days: [day1], lastSentIndex: 1,
    complete: 1 === totalDays, totalDays, trip
  });

  if (totalDays > 1) generateInBackground(tripId, trip, 1, totalDays);

  await saveBackup({ type: "itinerary", tripId, trip });
  await saveMemory(tripId, trip);

  res.json({ success: true, tripId, partial: true, itinerary: [day1], totalDays });
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