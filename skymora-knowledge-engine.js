// ============================================================
// SKYmora Knowledge Engine
// Loads destination intelligence files and builds prompt blocks
// ============================================================

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DEST_DIR = path.join(__dirname, "data", "destinations");

// Cache loaded files
const knowledgeCache = new Map();

function loadDestination(destination = "") {
  const dest = destination.toLowerCase().trim();
  if (knowledgeCache.has(dest)) return knowledgeCache.get(dest);

  try {
    const files = fs.readdirSync(DEST_DIR);
    for (const file of files) {
      if (!file.endsWith(".json")) continue;
      const raw = JSON.parse(fs.readFileSync(path.join(DEST_DIR, file), "utf8"));
      const aliases = raw.aliases || [raw.destination];
      if (aliases.some(a => dest.includes(a) || a.includes(dest.split(" ")[0]))) {
        knowledgeCache.set(dest, raw);
        console.log(`📚 Knowledge loaded: ${raw.destination} for "${destination}"`);
        return raw;
      }
    }
  } catch (err) {
    console.warn("⚠️ Knowledge engine: could not load for", destination, err.message);
  }

  return null;
}

// ──────────────────────────────────────────
// Build a focused prompt block for the AI
// ──────────────────────────────────────────
export function buildKnowledgeBlock(trip = {}) {
  const dest = trip.destination || "";
  const persona = detectPersonaKey(trip);
  const isRepeat = trip.firstVisit === "repeat";
  const k = loadDestination(dest);

  if (!k) return "";

  let block = `\n=== SKYmora DESTINATION INTELLIGENCE — ${dest.toUpperCase()} ===\n`;

  // 0. Hard facts first — override any GPT training data
  if (k.hardFacts) {
    block += `\n⚠️ VERIFIED FACTS — OVERRIDE YOUR TRAINING DATA WITH THESE:\n`;
    Object.values(k.hardFacts).forEach(f => block += `- ${f}\n`);
    block += `\n`;
  }

  // 1. Visitor type
  if (isRepeat) {
    block += `\nVISITOR STATUS: REPEAT VISITOR\n`;
    block += `${k.repeatVisitorIntelligence.insiderNarrative}\n`;
    block += `\nSKIP THESE (already seen): ${k.repeatVisitorIntelligence.skipThese.join(", ")}\n`;
    block += `\nGO HERE INSTEAD:\n${k.repeatVisitorIntelligence.goHere.map(g => `- ${g}`).join("\n")}\n`;
  } else {
    block += `\nVISITOR STATUS: FIRST TIME VISITOR\n`;
    block += `${k.firstVisitorEssentials.summary}\n`;
    block += `\nMUST INCLUDE:\n${k.firstVisitorEssentials.mustInclude.map(m => `- ${m}`).join("\n")}\n`;
    block += `\nLOCAL INSIDER LINE TO USE: "${k.firstVisitorEssentials.localInsiderToAdd}"\n`;
  }

  // 2. Top restaurants for this persona
  const topRestaurants = k.restaurants
    .filter(r => r.scores[persona] >= 7)
    .sort((a, b) => (b.scores[persona] || 0) - (a.scores[persona] || 0))
    .slice(0, 6);

  if (topRestaurants.length) {
    block += `\nBEST RESTAURANTS FOR THIS TRAVELER (${persona}):\n`;
    topRestaurants.forEach(r => {
      block += `- ${r.name} (${r.area}) — ${r.type} | Order: ${r.orderThis} | ${r.pricePerPerson}/person`;
      if (r.hours) block += ` | Hours: ${r.hours}`;
      block += "\n";
    });
  }

  // 3. Top activities for this persona
  const topActivities = k.activities
    .filter(a => {
      const score = a.scores[persona] || 0;
      if (isRepeat && a.scores.repeat) return a.scores.repeat >= 7;
      return score >= 7;
    })
    .sort((a, b) => {
      const keyA = isRepeat ? (a.scores.repeat || a.scores[persona] || 0) : (a.scores[persona] || 0);
      const keyB = isRepeat ? (b.scores.repeat || b.scores[persona] || 0) : (b.scores[persona] || 0);
      return keyB - keyA;
    })
    .slice(0, 6);

  if (topActivities.length) {
    block += `\nBEST ACTIVITIES FOR THIS TRAVELER:\n`;
    topActivities.forEach(a => {
      block += `- ${a.name} | ${a.price} | Best time: ${a.bestTime}\n`;
    });
  }

  // 3b. VERBATIM INSIDER NOTES — use these sentences exactly when writing about these venues
  const allVenues = [...(k.restaurants || []), ...(k.activities || [])];
  const venuesWithInsider = allVenues.filter(v => v.insider && (
    (v.scores[persona] >= 7) || (isRepeat && v.scores.repeat >= 7)
  )).slice(0, 8);

  if (venuesWithInsider.length) {
    block += `\nVERBATIM INSIDER NOTES — when you write about these venues, include these exact sentences. Do not paraphrase:\n`;
    venuesWithInsider.forEach(v => {
      block += `"${v.name}": ${v.insider}\n`;
    });
  }

  // 4. Designed surprise
  const surpriseKey = getSurpriseKey(persona, trip);
  const surprise = k.designedSurprises?.[surpriseKey];
  if (surprise) {
    block += `\nDESIGNED SURPRISE — THIS MUST APPEAR IN THE ITINERARY:\n`;
    block += `Experience: ${surprise.experience}\n`;
    block += `Details: ${surprise.details}\n`;
    block += `Why it works for this traveler: ${surprise.why}\n`;
    block += `HOW TO WRITE IT: Do not say "I recommend" or "you should visit." Write it as: "One thing worth knowing before you leave — [details]." Make it feel discovered, not prescribed.\n`;
  }

  // 5. Traffic intelligence
  if (k.trafficIntelligence) {
    block += `\nTRAFFIC & TIMING RULES:\n`;
    block += `- ${k.trafficIntelligence.itineraryRule}\n`;
    block += `- Worst day: ${k.trafficIntelligence.worstDay}\n`;
    block += `- Best cross-city window: ${k.trafficIntelligence.bestCrossCity}\n`;
    block += `- Rush hours: ${k.trafficIntelligence.rushHours}\n`;
  }

  // 6. Regrets to prevent
  const regrets = isRepeat
    ? k.firstVisitorEssentials?.regrets?.slice(0, 3)
    : k.firstVisitorEssentials?.regrets?.slice(0, 4);
  if (regrets?.length) {
    block += `\nCOMMON REGRETS TO PREVENT:\n`;
    regrets.forEach(r => block += `- ${r}\n`);
  }

  // 7. Pricing benchmarks (key ones)
  if (k.pricingBenchmarks) {
    const p = k.pricingBenchmarks;
    block += `\nVERIFIED PRICING (use these exact figures):\n`;
    block += `- Airport to Downtown: ${p.careem_airport_downtown} (Careem) vs ${p.careem_airport_marina} (to Marina)\n`;
    block += `- Metro airport to Downtown: ${p.metro_airport_downtown}\n`;
    block += `- Budget meal: ${p.meal_budget} | Mid-range: ${p.meal_mid} | Luxury: ${p.meal_luxury}\n`;
    block += `- Burj Khalifa online: ${p.burj_khalifa_online}\n`;
    block += `- Water bottle at store: ${p.water_bottle_baqala} (NOT hotel minibar AED 15-20)\n`;
  }

  // 8. Cultural rules
  if (k.culturalRules?.critical?.length) {
    block += `\nCRITICAL CULTURAL RULES (mention relevant ones naturally):\n`;
    k.culturalRules.critical.slice(0, 3).forEach(r => block += `- ${r}\n`);
  }

  // 9. Visa note for Indian travellers
  if (k.visaIntelligence?.indianPassport) {
    block += `\nVISA INTELLIGENCE: ${k.visaIntelligence.indianPassport}\n`;
  }

  block += `\n=== END DESTINATION INTELLIGENCE ===\n`;

  return block;
}

// ──────────────────────────────────────────
// Helper: detect persona key from trip data
// ──────────────────────────────────────────
function detectPersonaKey(trip = {}) {
  const style = (trip.travelStyle || "").toLowerCase();
  const req = (trip.specialRequest || "").toLowerCase();
  const adults = Number(trip.adults || 1);
  const children = Number(trip.children || 0);

  if (req.includes("honeymoon")) return "honeymoon";
  if (style.includes("luxury") || style.includes("elite")) return "luxury";
  if (req.includes("romantic") || req.includes("anniversary")) return "couple";
  if (req.includes("photo") || req.includes("photography")) return "photographer";
  if (req.includes("food") || req.includes("culinary")) return "foodie";
  if (req.includes("adventure")) return "adventure";
  if (children > 0) return "family";
  if (adults === 1) return "solo";
  if (adults >= 2) return "couple";
  return "firstTimer";
}

// ──────────────────────────────────────────
// Helper: get the right surprise key
// ──────────────────────────────────────────
function getSurpriseKey(persona, trip = {}) {
  const req = (trip.specialRequest || "").toLowerCase();
  if (req.includes("honeymoon")) return "honeymoon";
  if (persona === "couple") return "couple";
  if (persona === "family") return "family";
  if (persona === "foodie") return "foodie";
  if (persona === "photographer") return "photographer";
  if (persona === "adventure") return "adventure";
  if (persona === "luxury") return "honeymoon";
  if (persona === "solo") return "solo";
  if (trip.firstVisit === "repeat") return "repeat";
  return "budget";
}

export { loadDestination };
