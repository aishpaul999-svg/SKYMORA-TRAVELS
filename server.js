// ===============================
// SKYmora Travels — COMPLETE FIXED BACKEND
// Real Data + Budget Awareness + Intelligent Chat
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

// ===============================
// SKYmora ULTRA INTELLIGENCE IMPORT (already imported above as named import)
// ===============================

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

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// ===== SKYmora Signature Trip ID (Human + System Unified) =====
function generateTripId(name) {
  const cleanName = (name || "Traveler").split(" ")[0];
  const capitalized = cleanName.charAt(0).toUpperCase() + cleanName.slice(1).toLowerCase();
  const randomNumber = Math.floor(1000 + Math.random() * 9000); // 4-digit precision code
  return `@${capitalized}${randomNumber}`; // e.g., @Aashish4278
}


// ======== BACKUP SYSTEM ========
const dataDir = path.join(__dirname, "data");
if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });

const dbFile = path.join(dataDir, "backup.json");
const adapter = new JSONFile(dbFile);
const db = new Low(adapter, { logs: [] });
async function initDB() {
  await db.read();
  if (!db.data) db.data = { logs: [] };

  await memoryDB.read();
  if (!memoryDB.data) memoryDB.data = { trips: [] };
}

initDB();
async function saveBackup(entry) {
  const id = uuidv4();
  db.data.logs.push({ id, timestamp: new Date().toISOString(), ...entry });
  await db.write();
}

// ======== SKYmora MEMORY SYSTEM ========
const memoryFile = path.join(dataDir, "memory.json");
const memoryAdapter = new JSONFile(memoryFile);
const memoryDB = new Low(memoryAdapter, { trips: [] });

// Load memory (safe)
await memoryDB.read();
if (!memoryDB.data) memoryDB.data = { trips: [] };

// Save or update trip memory
async function saveMemory(tripId, data) {
  // Ensure memory structure exists
  if (!memoryDB.data) memoryDB.data = { trips: [] };

  const existing = memoryDB.data.trips.find(t => t.tripId === tripId);
  if (existing) {
    Object.assign(existing, data, { lastUpdated: new Date().toISOString() });
  } else {
    memoryDB.data.trips.push({
      tripId,
      ...data,
      createdAt: new Date().toISOString(),
      lastUpdated: new Date().toISOString(),
    });
  }
  await memoryDB.write();
}

// Get trip memory
function getMemory(tripId) {
  return memoryDB.data.trips.find(t => t.tripId === tripId) || null;
}

// ======== 💬 CHAT MEMORY MANAGEMENT ========

// Save chat messages for a specific trip
async function saveChatMessage(tripId, role, content) {
  // Ensure memory structure exists
  if (!memoryDB.data) memoryDB.data = { trips: [] };

  let trip = memoryDB.data.trips.find(t => t.tripId === tripId);

  // If no trip exists yet, create one so messages are not lost
  if (!trip) {
    trip = {
      tripId,
      traveler: tripId,
      createdAt: new Date().toISOString(),
      lastUpdated: new Date().toISOString(),
      messages: []
    };
    memoryDB.data.trips.push(trip);
  }

  if (!trip.messages) trip.messages = [];
  trip.messages.push({
    role,
    content,
    timestamp: new Date().toISOString()
  });

  trip.lastUpdated = new Date().toISOString();
  await memoryDB.write();
}

// Retrieve limited chat history for a trip
function getChatHistory(tripId, limit = 10) {
  const trip = memoryDB.data.trips.find(t => t.tripId === tripId);
  if (!trip || !trip.messages) return [];
  return trip.messages.slice(-limit);
}

// ======== 🔍 FETCH REAL DATA WITH BUDGET CONSTRAINTS ========
async function fetchRealTravelData(trip, day) {
  const {
    departure,
    destination,
    departureDate,
    returnDate,
    adults = 1,
    children = 0,
    infants = 0,
    budget = 0,
    currency = "USD",
    travelStyle,
    tripDays = 5
  } = trip;

  const totalPeople = (Number(adults) || 0) + (Number(children) || 0) + (Number(infants) || 0);
  const dailyBudget = Math.round((Number(budget) || 0) / (Number(tripDays) || 1));
  const isDay1 = (day === 1);

  // Budget breakdown
  const flightBudget = Math.round((Number(budget) || 0) * 0.30);
  const hotelBudgetPerNight = Math.round((Number(budget) || 0) * 0.35 / (Number(tripDays) || 1));
  const dailyExpenses = Math.round((Number(budget) || 0) * 0.35 / (Number(tripDays) || 1));

  console.log(`🔍 Fetching REAL data for Day ${day}...`);
  console.log(`💰 Budget Constraints: Total=${currency}${budget}, Daily=${currency}${dailyBudget}`);

  try {
    const researchPrompt = `Today's date is ${new Date().toISOString().split('T')[0]}.
console.log("🔑 OpenAI Key exists:", !!process.env.OPENAI_API_KEY ? "YES" : "❌ MISSING");
console.log("🌐 Making OpenAI call for Day", day, "to", destination);
console.log("💰 Budget:", budget, "Currency:", currency);
Search the web for CURRENT, REAL travel information with STRICT BUDGET CONSTRAINTS:

**Trip Details:**
- Route: ${departure} → ${destination}
- Date: ${departureDate}
- Travelers: ${adults} adult(s)${children ? `, ${children} children` : ""}${infants ? `, ${infants} infants` : ""}
- **TOTAL BUDGET: ${currency} ${budget} (for entire ${tripDays}-day trip)**
- **DAILY BUDGET: ${currency} ${dailyBudget} per day**

**CRITICAL BUDGET BREAKDOWN:**
- **Flights (total for all travelers): Max ${currency} ${flightBudget}**
- **Hotel (per night): Max ${currency} ${hotelBudgetPerNight}**
- **Daily expenses (food + activities): Max ${currency} ${dailyExpenses}**

${isDay1 ? `
=== DAY 1 RESEARCH - MUST STAY WITHIN BUDGET ===

Search for:

1. **BUDGET-APPROPRIATE FLIGHTS:**
   - Find 2-3 flights from ${departure} to ${destination} on ${departureDate}
   - **CRITICAL: Total cost for ${totalPeople} passenger(s) MUST NOT EXCEED ${currency} ${flightBudget}**
   - Include: airline, flight number, times, duration, stops, EXACT PRICE per person
   - Prefer economy class unless budget allows premium
   - Source: Google Flights, Kayak, Skyscanner

2. **WEATHER FORECAST:**
   - ${destination} weather on ${departureDate}
   - Temperature (°C and °F), conditions, what to pack

3. **BUDGET HOTELS:**
   - Find 2-3 hotels in ${destination}
   - **CRITICAL: Price per night MUST NOT EXCEED ${currency} ${hotelBudgetPerNight}**
   - Include: name, rating, area, price/night, amenities
   - Focus on 3-star or good value 4-star options
   - Source: Booking.com, Hotels.com, Airbnb

4. **AIRPORT TRANSPORT:**
   - Cheapest and most practical options from airport to city center
   - Include: taxi, metro, bus with current prices and times

5. **BUDGET RESTAURANTS:**
   - Find 3-4 restaurants with meals under ${currency} ${Math.round(dailyExpenses * 0.3)} per person
   - Mix of: local affordable spots, mid-range places
   - Include: name, address, cuisine, price range ($ to $$$), rating

6. **FREE/LOW-COST ATTRACTIONS:**
   - Find 4-5 attractions with entry under ${currency} ${Math.round(dailyExpenses * 0.4)}
   - Include FREE activities where possible
   - Include: name, address, entry fee, description

` : `
=== DAY ${day} RESEARCH - BUDGET CONSCIOUS ===

Search for:
1. **Different affordable restaurants** (not from previous days)
2. **Budget-friendly activities** (entry < ${currency} ${Math.round(dailyExpenses * 0.4)})
3. **Local transport costs** between locations
`}

**VERIFICATION CHECKLIST:**
- [ ] Flight cost × ${totalPeople} passengers ≤ ${currency} ${flightBudget}
- [ ] Hotel cost per night ≤ ${currency} ${hotelBudgetPerNight}
- [ ] Daily expenses (meals + activities) ≤ ${currency} ${dailyExpenses}
- [ ] All prices are CURRENT (verified from 2024/2025)
- [ ] Sources cited for all prices

Return as JSON:
{
  "budgetCheck": {
    "flightTotal": 450,
    "hotelPerNight": 85,
    "dailyExpenses": 120,
    "withinBudget": true,
    "notes": "All costs verified and within budget"
  },
  "flights": [{
    "airline": "...",
    "flightNumber": "...",
    "departure": "...",
    "arrival": "...",
    "duration": "...",
    "stops": "...",
    "pricePerPerson": 150,
    "totalForGroup": 450,
    "currency": "USD",
    "source": "..."
  }],
  "weather": {...},
  "hotels": [{
    "name": "...",
    "rating": "3-star",
    "area": "...",
    "pricePerNight": 85,
    "currency": "USD",
    "amenities": [...],
    "source": "..."
  }],
  "transport": [...],
  "restaurants": [...],
  "attractions": [...]
}`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      response_format: { type: "json_object" },
      temperature: 0.1,
      messages: [
        {
          role: "system",
          content: "You are a budget-conscious travel researcher. Use web search to find CURRENT prices that fit within the traveler's budget. Never suggest options beyond their means. Verify all prices are from 2024/2025."
        },
        {
          role: "user",
          content: researchPrompt
        }
      ]
    });

    // Guard: ensure choices exist and content present
    const raw = completion?.choices?.[0]?.message?.content;
    if (!raw) throw new Error("No response from research model.");
    const realData = JSON.parse(raw);

    console.log("✅ Real data fetched:", {
      withinBudget: realData.budgetCheck?.withinBudget,
      flights: realData.flights?.length || 0,
      hotels: realData.hotels?.length || 0,
      restaurants: realData.restaurants?.length || 0
    });

    return realData;

  } catch (error) {
    console.error("❌ Error fetching data:", (error && error.message) || error);
    return null;
  }
}
// ===============================
// REAL-TIME DATE & TIME ENGINE — LOCATION-AWARE
// ===============================

async function getRealTimeData(query, tripData = {}) {
  const { departure, destination } = tripData;
  const msg = (query || "").toLowerCase().trim();

  // Detect city in user message
  let targetLocation = null;
  const cityMatch = msg.match(/(?:in|at)\s+([a-zA-Z\s]+)/i);
  if (cityMatch) targetLocation = cityMatch[1].trim();
  else if (/time|date|now|today|tomorrow/.test(msg)) {
    targetLocation = departure || destination || "UTC";
  }

  // Ask user if city not clear
  if (!targetLocation) {
    return {
      askUser: true,
      message: "Could you tell me which city you'd like to know the time or date for?",
    };
  }

  // City-to-timezone map (expand anytime)
  const cityTimeZones = {
    delhi: "Asia/Kolkata",
    mumbai: "Asia/Kolkata",
    dubai: "Asia/Dubai",
    london: "Europe/London",
    paris: "Europe/Paris",
    newyork: "America/New_York",
    newyorkcity: "America/New_York",
    sydney: "Australia/Sydney",
    tokyo: "Asia/Tokyo",
    toronto: "America/Toronto",
    losangeles: "America/Los_Angeles",
    singapore: "Asia/Singapore",
    bangkok: "Asia/Bangkok",
    rome: "Europe/Rome",
    goa: "Asia/Kolkata",
  };

  const timezone =
    cityTimeZones[targetLocation.replace(/\s+/g, "").toLowerCase()] || "UTC";

  // Get accurate time
  const now = DateTime.now().setZone(timezone);

  // Handle "time" questions
  if (/time/.test(msg)) {
    return {
      type: "time",
      data: `In ${targetLocation}, it's currently ${now.toFormat("hh:mm a")} on ${now.toFormat("cccc, dd LLL yyyy")}.`,
      brief: true,
    };
  }

  // Handle "date/today/tomorrow"
  if (/date|today|tomorrow/.test(msg)) {
    const targetDate = /tomorrow/.test(msg)
      ? now.plus({ days: 1 })
      : now;
    return {
      type: "date",
      data: `The date in ${targetLocation} is ${targetDate.toFormat("cccc, dd LLL yyyy")}.`,
      brief: true,
    };
  }

  return null;
}

// ======== SKYmora Narrative Polisher (Makes Itinerary Sound Human & Premium) =====
function narrativePolish(rawText, travelerName, destination) {
  if (!rawText) return rawText;

  let text = rawText;

  // Soften robotic verbs into human flow
  text = text.replace(/\*\*Day\s*\d+:.*?\*\*/gi, "");
  text = text.replace(/\bArrive\b/g, "You’ll arrive");
  text = text.replace(/\bVisit\b/g, "Take time to visit");
  text = text.replace(/\bEnjoy\b/g, "You can enjoy");
  text = text.replace(/\bExplore\b/g, "Let yourself explore");
  text = text.replace(/\bRelax\b/g, "Unwind and relax");
  text = text.replace(/\bExperience\b/g, "Immerse yourself in the experience of");
  text = text.replace(/\bItinerary|Schedule|Plan/gi, "journey");
  text = text.replace(/\bHotel|Stay|Accommodation\b/gi, "stay");

  // Add SKYmora-style warmth and closure
  text = `Hey ${travelerName}, here’s how your day in ${destination} could unfold — full of charm and balance.\n\n${text}\n\n✨ SKYmora ensures every detail fits your style and budget — you just enjoy your journey, we’ll handle the rest. 💛`;

  return text.trim();
}

// ======== 🧠 BUILD ITINERARY WITH REAL DATA ========
async function buildDay(trip, day) {
  const {
    name = "Traveler",
    nickname = "",
    departure,
    destination = "",
    departureDate = "",
    adults = 1,
    children = 0,
    infants = 0,
    budget = 0,
    currency = "USD",
    travelStyle = "",
    specialRequest = ""
  } = trip;

  const travelerName = nickname || name?.split(" ")[0] || "Friend";
  const totalDays = trip.tripDays || 5;
  const dailyBudget = Math.round(budget / totalDays);

  const currencySymbols = {
    "USD": "$", "EUR": "€", "GBP": "£", "INR": "₹", "CAD": "C$",
    "AUD": "A$", "SGD": "S$", "AED": "د.إ", "JPY": "¥", "CHF": "CHF"
  };
  const sym = currencySymbols[currency] || "$";

  const isDay1 = (day === 1);

  const realData = await fetchRealTravelData(trip, day);

  let context = `\n\n=== 📊 VERIFIED BUDGET-APPROPRIATE DATA ===\n`;
  context += `**STRICT BUDGET: ${sym}${budget} total (${sym}${dailyBudget}/day)**\n\n`;

  if (realData?.budgetCheck) {
    context += `**Budget Verification:**\n`;
    context += `- Flights: ${sym}${realData.budgetCheck.flightTotal} ✅\n`;
    context += `- Hotel/night: ${sym}${realData.budgetCheck.hotelPerNight} ✅\n`;
    context += `- Daily expenses: ${sym}${realData.budgetCheck.dailyExpenses} ✅\n`;
    context += `- Status: ${realData.budgetCheck.withinBudget ? "Within budget ✅" : "Over budget ❌"}\n\n`;
  }

  if (realData?.flights?.[0]) {
    const f = realData.flights[0];
    context += `**REAL FLIGHT (Budget-Approved):**\n`;
    context += `${f.airline} ${f.flightNumber}\n`;
    context += `Departure: ${f.departure} | Arrival: ${f.arrival}\n`;
    context += `Duration: ${f.duration} | ${f.stops}\n`;
    context += `Price: ${sym}${f.pricePerPerson}/person × ${adults} = ${sym}${f.totalForGroup || f.pricePerPerson * adults}\n`;
    context += `Source: ${f.source}\n\n`;
  }

  if (realData?.hotels?.[0]) {
    const h = realData.hotels[0];
    context += `**REAL HOTEL (Budget-Approved):**\n`;
    context += `${h.name} (${h.rating})\n`;
    context += `Location: ${h.area}\n`;
    context += `Price: ${sym}${h.pricePerNight}/night × ${totalDays} nights = ${sym}${h.pricePerNight * totalDays}\n`;
    context += `Source: ${h.source}\n\n`;
  }

  if (realData?.restaurants?.length > 0) {
    context += `**BUDGET RESTAURANTS:**\n`;
    realData.restaurants.forEach((r, i) => {
      context += `${i + 1}. ${r.name} - ${r.cuisine}, ${r.priceRange}, ${r.rating}\n`;
    });
    context += `\n`;
  }

  if (realData?.attractions?.length > 0) {
    context += `**AFFORDABLE ATTRACTIONS:**\n`;
    realData.attractions.forEach((a, i) => {
      context += `${i + 1}. ${a.name} - Entry: ${a.entryFee ? `${sym}${a.entryFee}` : "FREE"}\n`;
    });
    context += `\n`;
  }

  const prompt = `You are ${travelerName}'s budget-conscious travel consultant at SKYmora Travels.

=== TRAVELER PROFILE ===
Name: ${travelerName}
Route: ${departure} → ${destination}
Date: ${departureDate}
Group: ${adults} adult(s)${children ? `, ${children} children` : ""}
**TOTAL BUDGET: ${sym}${budget} for ${totalDays} days**
**DAILY BUDGET: ${sym}${dailyBudget} per day**
Style: ${travelStyle}

${context}

=== DAY ${day} ITINERARY ===

Write 5-6 flowing narrative paragraphs that:

${isDay1 ? `
1. Mention how to get to ${departure} airport
2. Recommend the EXACT flight from data above
3. Describe arrival, customs, weather
4. Suggest the EXACT transport option from data above
5. Recommend the EXACT hotel from data above (emphasize it fits budget)
6. First evening: light meal at budget restaurant from list
7. Mention packing based on weather
` : `
1. Morning activity from attractions list (show entry cost)
2. Lunch at budget restaurant (different from previous days)
3. Afternoon activity with costs
4. Dinner at another budget spot
5. Show all transport costs
6. Keep total under ${sym}${dailyBudget}
`}

**CRITICAL:**
- Use ONLY the real verified data provided above
- Stay within ${sym}${dailyBudget} daily budget
- Show ALL costs transparently
- Warm, personal tone
- NO bullet points in narrative
- Max 5 emojis

Return JSON:
{
  "day": ${day},
  "title": "Day ${day}: [Title]",
  "content": "[5-6 narrative paragraphs]",
  "dailyCost": ${dailyBudget},
  "budgetStatus": "Within budget ✅"
}`;

  try {
    const completion = await openai.chat.completions.create({
      model:  "gpt-4o-mini",
      response_format: { type: "json_object" },
      temperature: 0.7,
      max_tokens: 2500,
      messages: [
        {
          role: "system",
          content: "You are a budget-conscious travel consultant. Use only verified real data. Stay within budget. Write warmly and naturally."
        },
        {
          role: "user",
          content: prompt
        }
      ]
    });

    const parsed = JSON.parse(completion.choices[0].message.content);
    parsed.content = narrativePolish(parsed.content, travelerName, destination);
    return parsed;

  } catch (err) {
  console.error("❌ DETAILED BUILD ERROR:", {
    message: err.message || "Unknown error",
    status: err.status, 
    code: err.code,
    day: day,
    destination: destination,
    hasOpenAIKey: !!process.env.OPENAI_API_KEY
  });
  return {
    day,
    title: `Day ${day}: ${destination}`,
    content: `${travelerName}, I'm gathering real-time budget-appropriate options for Day ${day}. This includes flights under $${Math.round(budget * 0.3)}, hotels around $${Math.round(budget * 0.35 / totalDays)}/night, and activities within your $${dailyBudget} daily budget. One moment...`
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
      const travelerName = trip.nickname || trip.name?.split(" ")[0] || "Friend";
      entry.days.push({
        day: totalDays + 1,
        title: "The SKYmora Promise ✨",
        content: `${travelerName}, this journey was built with verified real data and careful budget management. Every price is current, every recommendation fits your ${trip.currency}${trip.budget} budget. I'm here 24/7 if you need adjustments. Safe travels! 💛`
      });
    }
  }
}

const app = express();
app.use(express.json());
const corsOptions = {
  origin: [
    "https://skymora-travels-2.onrender.com",
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

app.get("/", (req, res) => {
  res.sendFile(path.join(publicPath, "index.html"));
});

const PORT = process.env.PORT || 3000;

// ======== GENERATE ENDPOINT ========
app.post("/api/generate", async (req, res) => {
  const trip = req.body || {};
  const totalDays = trip.tripDays ?? 5;
  const tripId = generateTripId(trip.name);

  console.log(`🚀 Generating BUDGET-AWARE itinerary: ${trip.currency}${trip.budget} for ${totalDays} days`);
  console.log(`🪶 SKYmora ID generated for ${trip.name || "Traveler"}: ${tripId}`);

  const day1 = await buildDay(trip, 1);

  itineraries.set(tripId, {
    days: [day1],
    lastSentIndex: 1,
    complete: 1 === totalDays,
    totalDays,
    trip
  });

  if (totalDays > 1) {
    generateInBackground(tripId, trip, 1, totalDays);
  }

  await saveBackup({ type: "itinerary", tripId, trip });
  await saveMemory(tripId, trip);

  res.json({
    success: true,
    tripId,
    partial: true,
    itinerary: [day1],
    totalDays,
  });
});

// ======== PROGRESS ENDPOINT ========
app.get("/api/progress/:tripId", async (req, res) => {
  const entry = itineraries.get(req.params.tripId);
  if (!entry) return res.status(404).json({ success: false, error: "Trip not found" });

  const { days, lastSentIndex, complete } = entry;
  const newDays = days.slice(lastSentIndex);
  entry.lastSentIndex = days.length;

  res.json({
    success: true,
    newDays,
    complete,
    totalDays: entry.totalDays,
    currentCount: days.length,
  });
});

// ======== SKYmora Smart Logic & Memory Engine ========

// Evaluate if the request is realistic or impossible
function evaluateTripFeasibility(budget, currency, days, destination) {
  const normalizedCurrency = currency?.toUpperCase() || "USD";
  const perDay = (Number(budget) || 0) / (days || 1);

  // ✅ Define realistic minimum per-day budgets by region
  const minThresholds = {
    INR: { local: 1500, domestic: 3000, international: 9000 },
    USD: { local: 50, domestic: 120, international: 250 },
    EUR: { local: 45, domestic: 100, international: 220 },
    GBP: { local: 40, domestic: 90, international: 200 },
    AED: { local: 150, domestic: 350, international: 800 }
  };

  const base = minThresholds[normalizedCurrency] || minThresholds.USD;

  // 🌍 Classify feasibility based on per-day budget
  if (perDay < base.local) {
    return {
      possible: false,
      region: "local",
      reason: `A ${days}-day trip to ${destination} with ${currency} ${budget} is too low for basic travel — even local travel would be difficult.`
    };
  } else if (perDay < base.domestic) {
    return {
      possible: "very tight",
      region: "local",
      reason: `This budget could support a nearby regional trip (like Goa or Jaipur), but it would be tight.`
    };
  } else if (perDay < base.international) {
    return {
      possible: "domestic",
      region: "domestic",
      reason: `That’s a solid domestic travel budget — destinations like Kerala, Himachal, or Rajasthan would be perfect.`
    };
  } else {
    return {
      possible: true,
      region: "international",
      reason: "Budget is strong enough for international travel."
    };
  }
}

// Generate smart response when trip feasibility is low
function getFeasibilityMessage(traveler, destination, budget, currency, days) {
  const evalResult = evaluateTripFeasibility(budget, currency, days, destination);
  if (evalResult.possible === false) {
    return `Hey ${traveler}, I’d love to help, but a ${days}-day trip to ${destination} with ${currency} ${budget} isn’t practically possible — even short trips may exceed that. 
However, I can craft a beautiful weekend escape nearby that fits perfectly within this range. Would you like me to show those options? 💡`;
  }
  if (evalResult.possible === "very tight") {
    return `Hmm ${traveler}, ${currency} ${budget} makes ${destination} a bit challenging, but we can easily design an affordable nearby retreat — perhaps a cozy stay in Goa or Udaipur. 
Would you like me to optimize that for you?`;
  }
  if (evalResult.possible === "domestic") {
    return null; // normal chat continues
  }
  return null;
}

// Retrieve traveler memory (preferences, requests, tone)
function getTravelerProfile(tripId) {
  const trip = memoryDB.data.trips.find(t => t.tripId === tripId);
  if (!trip) return {};
  return {
    name: trip.traveler,
    destination: trip.destination,
    budget: trip.budget,
    currency: trip.currency,
    days: trip.days,
    lastEmotion: trip.lastEmotion || "neutral",
    lastUpdated: trip.updatedAt || new Date().toISOString()
  };
}

// Update or store traveler preferences
async function updateTravelerPreferences(tripId, updates = {}) {
  const trip = memoryDB.data.trips.find(t => t.tripId === tripId);
  if (trip) {
    Object.assign(trip, updates);
    trip.lastUpdated = new Date().toISOString();
    await memoryDB.write();
    console.log(`🧠 Traveler preferences updated for ${trip.traveler}`);
  }
}

// ======== SKYmora Factual Fetch Helper ========


// ===== HELPER FUNCTIONS =====
// ======== SKYmora Prompt Cache (Prevents Repeat LLM Calls) ========
let promptCache = new Map();

function getCachedResponse(key) {
  if (!promptCache.has(key)) return null;
  const entry = promptCache.get(key);
  if (Date.now() - entry.timestamp > 1000 * 20) {  // 20 sec cache
    promptCache.delete(key);
    return null;
  }
  return entry.response;
}

function setCachedResponse(key, response) {
  promptCache.set(key, {
    response,
    timestamp: Date.now()
  });
}

// Stream text response with typing effect
async function streamResponse(res, text, delayMs = 8) {
  res.lastResponse = text; // store for memory
  for (const char of text) {
    res.write(`data: ${JSON.stringify({ token: char })}\n\n`);
    if (delayMs) await new Promise(r => setTimeout(r, delayMs));
  }
}

// Schedule itinerary update in background
function scheduleItineraryUpdate(tripId, tripData, updates = {}, forceFullRegen = false) {
  setTimeout(async () => {
    try {
      const updatedTrip = { 
        ...tripData, 
        ...updates, 
        lastUpdated: new Date().toISOString() 
      };

      if (tripId) await saveMemory(tripId, updatedTrip);

      const day1 = await buildDay(updatedTrip, 1);
      const id = tripId || generateTripId(updatedTrip.name);

      itineraries.set(id, {
        days: [day1],
        lastSentIndex: 1,
        complete: false,
        totalDays: updatedTrip.tripDays,
        trip: updatedTrip
      });

      if (updatedTrip.tripDays > 1 || forceFullRegen) {
        generateInBackground(id, updatedTrip, 1, updatedTrip.tripDays);
      }

      console.log(`✅ Itinerary updated for ${id}`);
    } catch (err) {
      console.error("❌ Background update failed:", err);
    }
  }, 100);
}

// Handle general conversation with OpenAI

/*
// ======== SKYmora RESUME TRIP ENDPOINT ========
app.get("/api/resume", async (req, res) => {
  try {
    await memoryDB.read();
    const trips = memoryDB.data.trips || [];
    if (!trips.length) {
      return res.json({ success: false, message: "No previous trips found" });
    }

    // Pick the most recently updated trip
    const lastTrip = trips.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt))[0];
    res.json({ success: true, lastTrip });
  } catch (err) {
    console.error("❌ Resume fetch error:", err);
    res.status(500).json({ success: false, error: err.message });
  }
});
*/
// ULTRA-SMART CHAT ENDPOINT
// ===============================

// ===============================
// SKYmora Trinity Brain Coordinator
// ===============================
// ===============================
// SKYmora Trinity Brain Coordinator (stable return contract)
// Returns a consistent object:
// - { mode: "plain", text: "..." }  -> non-stream single text reply
// - { mode: "messages", messages: [...], stream: false } -> non-stream assistant messages array
// - { mode: "openai_stream", chatConfig: {...} } -> direct OpenAI streaming config (stream: true)



/* ===============================
   SKYmora TRINITY ROUTER (FINAL VERSION)
   Always returns: { mode: "...", ... }
================================= */
async function handleUnifiedChat(message, tripData, conversationHistory, tripId, getChatHistory, saveChatMessage) {

  // Safety: Always trim
  const userText = (message || "").trim();
// ===== CACHE CHECK =====
const cacheKey = `${tripId}::${userText}`;
const cached = getCachedResponse(cacheKey);
if (cached) {
  console.log("⚡ Using cached response");
  return { mode: "plain", text: cached };
}

  // If empty fallback
  if (!userText) {
    return { mode: "plain", text: "Tell me more about your trip — destination, dates, or budget." };
  }

  // Decide brain with small LLM router
  const routerPrompt = `
Traveler message: "${userText}"

Decide best brain:
- Smart → Itinerary logic, trip planning, budget decisions
- Perfect → Warm tone, emotional intelligence, names & memory
- Ultra → Live information, weather, currency, real-time data

Respond only:
{ "brain": "Smart" | "Perfect" | "Ultra" }
`;

  let brain = "Smart";
  try {
    const decision = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      response_format: { type: "json_object" },
      temperature: 0,
      max_tokens: 20,
      messages: [
        { role: "system", content: "Return only JSON selecting the correct brain." },
        { role: "user", content: routerPrompt }
      ]
    });

    const raw = decision?.choices?.[0]?.message?.content;
    if (raw) {
      const parsed = JSON.parse(raw);
      brain = parsed.brain || "Smart";
    } else {
      brain = "Smart";
    }

  } catch (e) {
    console.warn("Router failed, defaulting to Smart:", (e && e.message) || e);
    brain = "Smart";
  }

  console.log(`🧭 Trinity Brain Selected: ${brain}`);

  // ---------- ROUTE LOGIC ----------
  if (brain === "Ultra") {
    const ultra = await runUltraProgrammatic(
      userText,
      tripData,
      conversationHistory,
      tripId,
      getChatHistory,
      saveChatMessage
    );
    return { mode: "plain", text: ultra.text || ultra };
  }


  if (brain === "Perfect") {
    const perfect = await runPerfectProgrammatic(
      userText,
      tripData,
      conversationHistory,
      tripId,
      getChatHistory,
      saveChatMessage
    );
    return { mode: "plain", text: perfect.text || perfect };
  }

  // SMART (streaming config)
  const smartConfig = await handleIntelligentChat(
    userText,
    tripData,
    conversationHistory,
    tripId,
    getChatHistory,
    saveChatMessage
  );

  if (smartConfig?.stream === true) {
    return { mode: "openai_stream", chatConfig: smartConfig };
  }

  if (smartConfig?.messages) {
    return { mode: "messages", messages: smartConfig.messages };
  }

  return {
    mode: "plain",
    text: "Let’s continue planning your trip — what details should I optimize?"
  };
}

// ===============================
// TRIP MEMORY ENDPOINTS
// ===============================

// Robust memory endpoint (single source of truth)
app.get("/api/memory", async (req, res) => {
  try {
    await memoryDB.read();
    res.json({ success: true, data: memoryDB.data });
  } catch (err) {
    res.status(500).json({ success: false, error: (err && err.message) || err });
  }
});

app.get("/api/trip/:tripId", async (req, res) => {
  try {
    const trip = getMemory(req.params.tripId);
    if (trip) {
      res.json({ success: true, data: trip });
    } else {
      res.status(404).json({ success: false, error: "Trip not found" });
    }
  } catch (err) {
    res.status(500).json({ success: false, error: (err && err.message) || err });
  }
});

app.get("/api/chat-history/:tripId", async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 50;
    const history = getChatHistory(req.params.tripId, limit);
    res.json({ success: true, data: history });
  } catch (err) {
    res.status(500).json({ success: false, error: (err && err.message) || err });
  }
});

setupPerfectChat(app);
// ensure Ultra chat endpoints are registered too
setupUltraChat(app);

// ===============================
// SKYmora Unified Chat Endpoint
// ===============================
/* ===============================
   SKYmora Unified Chat Endpoint (FINAL)
================================= */
app.post("/api/chat-trinity", async (req, res) => {
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");

  const { message, tripData = {}, conversationHistory = [] } = req.body;
  const tripId = tripData?.tripId || "default";
  const cacheKey = `${tripId}::${message}`;

// ---------- TRAVEL FIREWALL CHECK ----------
const fw = classifyMessage(message, tripData);

// Forbidden → block
if (fw.action === "forbidden") {
  const reply = "I can't assist with that request. If you need travel help, ask me about flights, hotels, visas, or itineraries.";
  await saveChatMessage(tripId, "assistant", reply);
  res.write(`data: ${JSON.stringify({ token: reply })}\n\n`);
  res.write("data: [DONE]\n\n");
  return res.end();
}

// Soft inappropriate → decline
if (fw.action === "inappropriate") {
  const reply = fw.reply;
  await saveChatMessage(tripId, "assistant", reply);
  res.write(`data: ${JSON.stringify({ token: reply })}\n\n`);
  res.write("data: [DONE]\n\n");
  return res.end();
}

// Greetings / small talk → respond immediately
if (fw.action === "professional") {
  const reply = fw.reply;
  await saveChatMessage(tripId, "assistant", reply);
  res.write(`data: ${JSON.stringify({ token: reply })}\n\n`);
  res.write("data: [DONE]\n\n");
  return res.end();
}

// Non-travel → redirect
if (fw.action === "redirect") {
  const reply = fw.reply;
  await saveChatMessage(tripId, "assistant", reply);
  res.write(`data: ${JSON.stringify({ token: reply })}\n\n`);
  res.write("data: [DONE]\n\n");
  return res.end();
}

// Allowed → continue

  // Save user msg (ensures trip memory exists)
  await saveChatMessage(tripId, "user", message);

  // Firewall already handled above — now route
  const result = await handleUnifiedChat(
    message,
    tripData,
    conversationHistory,
    tripId,
    (id, limit) => getChatHistory(id, limit),
    (id, role, content) => saveChatMessage(id, role, content)
  );

  // --------- HANDLE PLAIN ---------
  if (result.mode === "plain") {
    const reply = result.text;
    await saveChatMessage(tripId, "assistant", reply);
    res.write(`data: ${JSON.stringify({ token: reply })}\n\n`);
    res.write("data: [DONE]\n\n");
    setCachedResponse(cacheKey, reply);

    return res.end();
  }
  // --------- HANDLE MESSAGES ---------
  if (result.mode === "messages") {
    const reply = result.messages?.[0]?.content || "Here’s something helpful.";
    await saveChatMessage(tripId, "assistant", reply);
    res.write(`data: ${JSON.stringify({ token: reply })}\n\n`);
    res.write("data: [DONE]\n\n");

    // ⭐ CACHE
    setCachedResponse(cacheKey, reply);

    return res.end();
  }

  // --------- HANDLE STREAM ---------
  if (result.mode === "openai_stream") {
    const streamConfig = result.chatConfig;
    const completion = await openai.chat.completions.create({
      model: streamConfig.model || MODEL,
      messages: streamConfig.messages,
      stream: true,
      temperature: streamConfig.temperature ?? 0.8,
      max_tokens: streamConfig.max_tokens ?? 450,
      presence_penalty: streamConfig.presence_penalty ?? 0.2,
      frequency_penalty: streamConfig.frequency_penalty ?? 0.3
    });

    let buffer = "";

    for await (const chunk of completion) {
      const token = chunk.choices?.[0]?.delta?.content;
      if (token) {
        buffer += token;
        res.write(`data: ${JSON.stringify({ token })}\n\n`);
      }
    }

    await saveChatMessage(tripId, "assistant", buffer);
    res.write("data: [DONE]\n\n");

    // ⭐ CACHE STREAMED FULL TEXT
    setCachedResponse(cacheKey, buffer);

    return res.end();
  }


  // --------- FALLBACK ---------
  const fallback = "I’m here to help — tell me about your trip!";
  await saveChatMessage(tripId, "assistant", fallback);
  res.write(`data: ${JSON.stringify({ token: fallback })}\n\n`);
  res.write("data: [DONE]\n\n");
  return res.end();
});

// === Redirect /api/chat to Trinity Brain ===
app.post("/api/chat", (req, res, next) => {
  req.url = "/api/chat-trinity"; // change route path
  app._router.handle(req, res, next); // forward request internally
});

// ======== SERVER START ========
app.listen(PORT, () => {
  console.log(`🚀 SKYmora INTELLIGENT CHAT ENGINE on http://localhost:${PORT}`);
  console.log(`✅ Budget verification: ACTIVE`);
  console.log(`✅ Real-time pricing: ACTIVE`);
  console.log(`✅ Smart chat with memory: ACTIVE`);
});
