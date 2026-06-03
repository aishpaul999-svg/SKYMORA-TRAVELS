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

export function loadDestination(destination = "") {
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

  // Always use real system date — never hardcoded
  const now = new Date();
  const currentDate = now.toLocaleDateString('en-GB', { day:'numeric', month:'long', year:'numeric' });
  const currentMonth = now.toLocaleString('en-GB', { month:'long' });
  const currentYear = now.getFullYear();
  const ym = now.toLocaleString('en-GB', { month:'long', year:'numeric' });

  let block = `\n=== SKYmora DESTINATION INTELLIGENCE — ${dest.toUpperCase()} ===\n`;
  block += `TODAY'S DATE: ${currentDate}. Use this as the reference for all seasonal, event, and timing intelligence. Never use 2024 or 2025 as the current year — it is ${currentYear}.\n`;

  // 0. Hard facts first — override any GPT training data
  if (k.hardFacts) {
    block += `\n⚠️ VERIFIED FACTS — OVERRIDE YOUR TRAINING DATA WITH THESE:\n`;
    Object.values(k.hardFacts).forEach(f => block += `- ${f}\n`);
    block += `\n`;
  }

  // 1. Visitor type
  if (isRepeat) {
    block += `\nVISITOR STATUS: REPEAT VISITOR\n`;
    if (k.repeatVisitorIntelligence?.insiderNarrative) block += `${k.repeatVisitorIntelligence.insiderNarrative}\n`;
    if (k.repeatVisitorIntelligence?.skipThese?.length) block += `\nSKIP THESE (already seen): ${k.repeatVisitorIntelligence.skipThese.join(", ")}\n`;
    if (k.repeatVisitorIntelligence?.goHere?.length) block += `\nGO HERE INSTEAD:\n${k.repeatVisitorIntelligence.goHere.map(g => `- ${g}`).join("\n")}\n`;
  } else {
    block += `\nVISITOR STATUS: FIRST TIME VISITOR\n`;
    if (k.firstVisitorEssentials?.summary) {
      block += `${k.firstVisitorEssentials.summary}\n`;
      if (k.firstVisitorEssentials.mustInclude?.length) block += `\nMUST INCLUDE:\n${k.firstVisitorEssentials.mustInclude.map(m => `- ${m}`).join("\n")}\n`;
      if (k.firstVisitorEssentials.localInsiderToAdd) block += `\nLOCAL INSIDER LINE TO USE: "${k.firstVisitorEssentials.localInsiderToAdd}"\n`;
    }
  }

  // 2. Top restaurants for this persona (international schema only)
  const topRestaurants = (k.restaurants || [])
    .filter(r => r.scores?.[persona] >= 7)
    .sort((a, b) => (b.scores?.[persona] || 0) - (a.scores?.[persona] || 0))
    .slice(0, 6);

  if (topRestaurants.length) {
    block += `\nBEST RESTAURANTS FOR THIS TRAVELER (${persona}):\n`;
    topRestaurants.forEach(r => {
      block += `- ${r.name} (${r.area}) — ${r.type} | Order: ${r.orderThis} | ${r.pricePerPerson}/person`;
      if (r.hours) block += ` | Hours: ${r.hours}`;
      block += "\n";
    });
  }

  // 3. Top activities for this persona (international schema only)
  const topActivities = (k.activities || [])
    .filter(a => {
      const score = a.scores?.[persona] || 0;
      if (isRepeat && a.scores?.repeat) return a.scores.repeat >= 7;
      return score >= 7;
    })
    .sort((a, b) => {
      const keyA = isRepeat ? (a.scores?.repeat || a.scores?.[persona] || 0) : (a.scores?.[persona] || 0);
      const keyB = isRepeat ? (b.scores?.repeat || b.scores?.[persona] || 0) : (b.scores?.[persona] || 0);
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

  // 10. WHY PEOPLE FALL IN LOVE — the emotional soul of the destination
  if (k.whyPeopleFallInLove) {
    block += `\nWHY PEOPLE FALL IN LOVE WITH THIS DESTINATION:\n${k.whyPeopleFallInLove}\n`;
    block += `INSTRUCTION: Use this as the emotional undercurrent of the entire itinerary. This is why the traveller will return. Build toward this feeling.\n`;
  }

  // 14. RESIDENT SUNDAY — how a local actually spends a free day
  if (k.residentSunday) {
    block += `\nRESIDENT BEHAVIOUR — HOW A LOCAL SPENDS A FREE SUNDAY:\n${k.residentSunday}\n`;
    block += `INSTRUCTION: Use this as the template for the best day in the itinerary. This is the day that makes the traveller feel like a resident, not a tourist.\n`;
  }

  // 15. TRIP LENGTH GUIDE — what to cut/add based on duration
  const tripDays = trip.tripDays || 3;
  if (k.tripLengthGuide) {
    const guide = tripDays <= 2 ? k.tripLengthGuide.two_days :
                  tripDays <= 4 ? k.tripLengthGuide.three_to_four_days :
                  tripDays <= 6 ? k.tripLengthGuide.five_to_six_days :
                  k.tripLengthGuide.seven_plus_days;
    if (guide) {
      block += `\nTRIP LENGTH INTELLIGENCE (${tripDays} days):\n`;
      block += `Must include: ${guide.must_include?.join(', ')}\n`;
      block += `Skip or cut: ${guide.skip?.join(', ')}\n`;
      if (guide.note) block += `Note: ${guide.note}\n`;
    }
  }

  // 16. ANTI-PATTERNS — combinations that go wrong
  if (k.antiPatterns?.length) {
    block += `\nANTI-PATTERNS — NEVER PUT THESE COMBINATIONS IN THE SAME DAY:\n`;
    k.antiPatterns.forEach(ap => block += `- ${ap}\n`);
  }

  // 17. DAY MEMORY TARGETS — what the traveller remembers in 5 years
  // Note: day number is not available here (this runs once per trip at planning stage)
  // Inject all three memory targets so the planning engine can assign them per day
  if (k.dayMemoryTargets) {
    block += `\nDAY MEMORY TARGETS (assign one per day):\n`;
    if (k.dayMemoryTargets.arrival) block += `- Arrival day memory: ${k.dayMemoryTargets.arrival}\n`;
    if (k.dayMemoryTargets.peak) block += `- Peak day memory: ${k.dayMemoryTargets.peak}\n`;
    if (k.dayMemoryTargets.departure) block += `- Departure day memory: ${k.dayMemoryTargets.departure}\n`;
    block += `INSTRUCTION: Each day must have one specific moment designed to deliver its memory target. Not the attraction — the moment within it.\n`;
  }

  // 11. LOCAL TRUTHS — contrast lines that make SKYmora sound like an expert
  if (k.localTruths?.length) {
    block += `\nLOCAL TRUTHS — use at least one of these contrast lines naturally in the itinerary:\n`;
    k.localTruths.forEach(t => block += `"${t}"\n`);
  }

  // 12. IF YOU ONLY HAD ONE CHANCE — forced prioritisation
  if (k.ifYouOnlyHadOneChance) {
    const o = k.ifYouOnlyHadOneChance;
    block += `\nIF THIS TRAVELER ONLY HAD ONE CHANCE:\n`;
    if (o.breakfast) block += `- One breakfast: ${o.breakfast}\n`;
    if (o.sunset) block += `- One sunset: ${o.sunset}\n`;
    if (o.neighbourhood) block += `- One neighbourhood: ${o.neighbourhood}\n`;
    if (o.meal) block += `- One meal: ${o.meal}\n`;
    if (o.memory) block += `- One memory: ${o.memory}\n`;
    if (o.secret) block += `- The secret: ${o.secret}\n`;
    block += `INSTRUCTION: Weave these into the itinerary as natural peaks, not as a list. Each one should feel earned by the day that leads to it.\n`;
  }

  // 13. NEIGHBOURHOOD DNA — personality matching
  if (k.neighborhoodPersonalities) {
    block += `\nNEIGHBOURHOOD PERSONALITIES (match to traveler type):\n`;
    Object.entries(k.neighborhoodPersonalities).forEach(([name, tags]) => {
      block += `- ${name}: ${tags.join(', ')}\n`;
    });
    block += `INSTRUCTION: When recommending a neighbourhood, describe its personality using these tags, not just its attractions.\n`;
  }

  // 18. GETTING HERE — correct transport from Indian cities
  if (k.gettingHere) {
    const dep = trip.departure?.toLowerCase() || '';
    const depKey = dep.includes('delhi') || dep.includes('new delhi') ? 'fromDelhi' :
                   dep.includes('mumbai') || dep.includes('bombay') ? 'fromMumbai' :
                   dep.includes('bangalore') || dep.includes('bengaluru') ? 'fromBangalore' :
                   dep.includes('chennai') ? 'fromChennai' : 'fromDelhi';
    const depInfo = k.gettingHere[depKey] || k.gettingHere.fromDelhi;
    if (depInfo?.flight) {
      block += `\nGETTING THERE FROM ${(trip.departure || 'India').toUpperCase()}:\n`;
      block += `- Flight: ${depInfo.flight.duration} | Airlines: ${depInfo.flight.airlines?.join(', ')} | Price: ${depInfo.flight.priceRange}\n`;
      if (depInfo.flight.note) block += `- Note: ${depInfo.flight.note}\n`;
    }
    if (k.gettingHere.airportToCity || k.gettingHere.airportToAccommodation) {
      const transfers = k.gettingHere.airportToCity || k.gettingHere.airportToAccommodation;
      block += `Airport transfers: ${JSON.stringify(transfers).slice(0,300)}\n`;
    }
  }

  // 19. NEARBY DESTINATIONS — suggest combinations
  if (k.nearbyDestinations?.length && (trip.tripDays || 0) >= 4) {
    const relevant = k.nearbyDestinations.filter(nd => {
      if (!nd.suggestIf) return true;
      const days = trip.tripDays || 0;
      const minDays = parseInt(nd.suggestIf.match(/\d+/)?.[0] || '99');
      return days >= minDays;
    });
    if (relevant.length) {
      block += `\nNEARBY DESTINATIONS WORTH COMBINING (${trip.tripDays} day trip):\n`;
      relevant.slice(0,2).forEach(nd => {
        block += `- ${nd.city}: ${nd.travelTime} | ${nd.whyCombine}\n`;
      });
      block += `INSTRUCTION: Mention relevant nearby destinations naturally as an option in the itinerary if the trip length supports it.\n`;
    }
  }

  // 20. LANGUAGE INTELLIGENCE — useful for Day 1
  if (k.languageIntelligence && isRepeat === false) {
    block += `\nLANGUAGE INTELLIGENCE:\n`;
    block += `Working language: ${k.languageIntelligence.workingLanguage}\n`;
    if (k.languageIntelligence.criticalNote) block += `Critical: ${k.languageIntelligence.criticalNote}\n`;
    if (k.languageIntelligence.indianLanguageSupport) block += `For Indian travellers: ${k.languageIntelligence.indianLanguageSupport}\n`;
  }

  // 21. LIVE INTELLIGENCE — current reality check
  if (k.liveIntelligence) {
    if (k.liveIntelligence.seasonalNow) {
      block += `\nCURRENT SEASONAL INTELLIGENCE: ${k.liveIntelligence.seasonalNow}\n`;
    }
    if (k.liveIntelligence.strikesDisruptions && k.liveIntelligence.strikesDisruptions !== '') {
      block += `CURRENT DISRUPTIONS: ${k.liveIntelligence.strikesDisruptions}\n`;
    }
    if (Array.isArray(k.liveIntelligence.currentAlerts) && k.liveIntelligence.currentAlerts.length) {
      block += `LIVE ALERTS: ${k.liveIntelligence.currentAlerts.join(' | ')}\n`;
    }
    if (k.liveIntelligence.entryRequirements) {
      block += `ENTRY REQUIREMENTS (as of ${ym}): ${k.liveIntelligence.entryRequirements}\n`;
    }
  }

  // 22. HEALTH INTELLIGENCE — important for Day 1 logistics
  if (k.healthIntelligence?.waterSafety) {
    block += `\nHEALTH: Water: ${k.healthIntelligence.waterSafety} | Insurance: ${k.healthIntelligence.travelInsuranceNote || 'Travel insurance strongly recommended'}\n`;
  }

  // 23. COMBINATION INTELLIGENCE — emotional day sequences
  if (k.combinationIntelligence?.length) {
    const persona = detectPersonaKey(trip);
    const relevant = k.combinationIntelligence.filter(c =>
      !c.bestFor || c.bestFor.includes(persona) || c.bestFor.includes('firstTimer')
    ).slice(0, 3);
    if (relevant.length) {
      block += `\nCOMBINATION INTELLIGENCE — PROVEN EMOTIONAL SEQUENCES FOR THIS DESTINATION:\n`;
      relevant.forEach((c, i) => {
        block += `Sequence ${i+1}: ${c.sequence.join(' → ')}\n`;
        block += `  Arc: ${c.emotionalArc}\n`;
      });
      block += `INSTRUCTION: Use at least one of these proven sequences as the skeleton for a day. The arc matters as much as the activities.\n`;
    }
  }

  // 24. PHOTOGRAPHY INTELLIGENCE — if photographer persona or special request
  const req = (trip.specialRequest || "").toLowerCase();
  if (k.photographyIntelligence && (req.includes("photo") || req.includes("camera") || detectPersonaKey(trip) === "photographer")) {
    const pi = k.photographyIntelligence;
    block += `\nPHOTOGRAPHY INTELLIGENCE:\n`;
    if (pi.bestShotLocations?.length) {
      pi.bestShotLocations.slice(0, 4).forEach(l => {
        if (typeof l === 'object') block += `- ${l.name} (${l.bestTime}): ${l.what}${l.tip ? ' — ' + l.tip : ''}\n`;
      });
    }
    if (pi.goldenHour) block += `Golden hour: ${pi.goldenHour}\n`;
    if (pi.droneRules) block += `Drone rules: ${pi.droneRules}\n`;
  }

  // ══════════════════════════════════════════════════════════
  // INDIA-SPECIFIC SECTIONS (v4.0-india schema only)
  // These sections are unique to Indian destinations and
  // contain intelligence that international files don't have
  // ══════════════════════════════════════════════════════════

  if (k._schemaVersion === '4.0-india') {
    const budget = Number(trip.budget || 0);
    const currency = (trip.currency || 'INR').toUpperCase();
    const departure = (trip.departure || '').toLowerCase();

    // 25. TRANSPORTATION REALITY — real trains, real prices
    if (k.transportationReality) {
      const tr = k.transportationReality;
      const depKey = departure.includes('delhi') || departure.includes('new delhi') ? 'fromDelhi' :
                     departure.includes('mumbai') || departure.includes('bombay') ? 'fromMumbai' :
                     departure.includes('bangalore') || departure.includes('bengaluru') ? 'fromBangalore' :
                     departure.includes('chennai') ? 'fromChennai' : 'fromDelhi';
      const depInfo = tr[depKey] || tr.fromDelhi;

      if (depInfo) {
        block += `\nTRANSPORTATION — HOW TO GET THERE FROM ${(trip.departure || 'DELHI').toUpperCase()}:\n`;
        if (depInfo.train) block += `Train: ${depInfo.train}\n`;
        if (depInfo.bus) block += `Bus: ${depInfo.bus}\n`;
        if (depInfo.flight) block += `Flight: ${depInfo.flight}\n`;
        if (depInfo.recommended) block += `SKYmora Recommendation: ${depInfo.recommended}\n`;
        if (depInfo.budgetTip) block += `Budget Tip: ${depInfo.budgetTip}\n`;
      }
      if (tr.localTransport) {
        const lt = tr.localTransport;
        block += `Local Transport: ${lt.best || ''}`;
        if (lt.avoid) block += ` | Avoid: ${lt.avoid}`;
        if (lt.appRecommendation) block += ` | App: ${lt.appRecommendation}`;
        if (lt.cost) block += ` | Daily cost: ${lt.cost}`;
        block += '\n';
      }
      block += `INSTRUCTION: Use exact train names and prices in Day 1 transport section. Do NOT invent train numbers.\n`;
    }

    // 26. BUDGET REALITY — real INR tiers
    if (k.budgetReality) {
      const br = k.budgetReality;
      // Detect which budget tier this traveler is
      let tier = 'comfortable';
      if (currency === 'INR') {
        const tripDays = Number(trip.tripDays || 3);
        const perDay = budget / tripDays;
        if (perDay < 2500) tier = 'backpacker';
        else if (perDay < 8000) tier = 'comfortable';
        else if (perDay < 20000) tier = 'premium';
        else tier = 'luxury';
      }
      const tierData = br[tier] || br.comfortable;
      block += `\nBUDGET REALITY FOR THIS TRAVELER (${tier.toUpperCase()} tier):\n`;
      if (tierData?.perDay) block += `Daily budget: ${tierData.perDay}\n`;
      if (tierData?.accommodation) block += `Accommodation: ${tierData.accommodation}\n`;
      if (tierData?.food) block += `Food approach: ${tierData.food}\n`;
      if (tierData?.transport) block += `Local transport: ${tierData.transport}\n`;
      if (br.backpacker?.perDay) block += `Reference: Backpacker=${br.backpacker.perDay} | Comfortable=${br.comfortable?.perDay} | Premium=${br.premium?.perDay}\n`;
      block += `INSTRUCTION: Use these real INR figures. Never suggest hotels/restaurants outside this budget tier without flagging the cost.\n`;
    }

    // 27. SCAM PREVENTION — specific named scams
    if (k.scamPrevention?.length) {
      block += `\nSCAM PREVENTION — MENTION THESE NATURALLY IN THE ITINERARY:\n`;
      k.scamPrevention.slice(0, 4).forEach(s => {
        block += `- ${s.scam}: ${s.prevention}`;
        if (s.ifItHappens) block += ` (If it happens: ${s.ifItHappens})`;
        block += '\n';
      });
      block += `INSTRUCTION: Weave relevant scam warnings naturally into Day 1 (ONE THING TO KNOW section). Not as a scary list — as insider knowledge that protects this specific traveler.\n`;
    }

    // 28. FOOD SAFETY — safe zones, must-eat, water
    if (k.foodSafety) {
      const fs_data = k.foodSafety;
      block += `\nFOOD INTELLIGENCE:\n`;
      if (fs_data.mustEat?.length) block += `Must eat: ${fs_data.mustEat.slice(0,3).join(' | ')}\n`;
      if (fs_data.safeStreetFood?.length) block += `Safe street food: ${fs_data.safeStreetFood.slice(0,3).join(' | ')}\n`;
      if (fs_data.waterAdvice) block += `Water: ${fs_data.waterAdvice}\n`;
      if (fs_data.touristTrap) block += `Tourist trap to avoid: ${fs_data.touristTrap}\n`;
      if (fs_data.trustedDhabas) block += `How to spot trusted dhabas: ${fs_data.trustedDhabas}\n`;
      block += `INSTRUCTION: Reference specific must-eat items and their locations in the itinerary. The food section should feel like advice from a local, not a menu listing.\n`;
    }

    // 29. CULTURAL INTELLIGENCE
    if (k.culturalIntelligence) {
      const ci = k.culturalIntelligence;
      block += `\nCULTURAL INTELLIGENCE:\n`;
      if (ci.dressCode) block += `Dress: ${ci.dressCode}\n`;
      if (ci.photographyRules) block += `Photography: ${ci.photographyRules}\n`;
      if (ci.templeEtiquette) block += `Temple etiquette: ${ci.templeEtiquette}\n`;
      if (ci.timing) block += `Timing insight: ${ci.timing}\n`;
      if (ci.localCustom) block += `Local custom: ${ci.localCustom}\n`;
    }

    // 30. FIRST vs REPEAT VISIT INTELLIGENCE
    if (k.firstVsRepeatVisit) {
      const fvr = k.firstVsRepeatVisit;
      const visitKey = isRepeat ? 'repeat' : 'first';
      const visitData = fvr[visitKey];
      if (visitData) {
        block += `\n${isRepeat ? 'REPEAT VISITOR' : 'FIRST VISIT'} INTELLIGENCE:\n`;
        if (visitData.mustDo?.length) block += `Must do: ${visitData.mustDo.join(' | ')}\n`;
        if (visitData.avoid?.length) block += `Avoid: ${visitData.avoid.join(' | ')}\n`;
        if (visitData.mindset) block += `Mindset: ${visitData.mindset}\n`;
        if (visitData.goDeeper?.length) block += `Go deeper: ${visitData.goDeeper.join(' | ')}\n`;
        if (visitData.local) block += `Local secret: ${visitData.local}\n`;
      }
    }

    // 31. SEASONAL INTELLIGENCE — month-specific reality
    if (k.seasonalIntelligence) {
      const si = k.seasonalIntelligence;
      block += `\nSEASONAL INTELLIGENCE (${currentMonth} ${currentYear}):\n`;
      if (si.bestMonth) block += `Best month: ${si.bestMonth}\n`;
      if (si.worstMonth) block += `Worst month: ${si.worstMonth}\n`;
      // Detect current season
      const month = now.getMonth(); // 0-11
      const isMonthInRange = (rangeStr) => {
        if (!rangeStr) return false;
        const monthNames = ['jan','feb','mar','apr','may','jun','jul','aug','sep','oct','nov','dec'];
        const currentM = monthNames[month];
        return rangeStr.toLowerCase().includes(currentM);
      };
      if (isMonthInRange(si.peakSeason?.months)) {
        block += `Current season: PEAK — ${si.peakSeason.weather || ''} | Crowds: ${si.peakSeason.crowds || ''} | ${si.peakSeason.verdict || ''}\n`;
      } else if (isMonthInRange(si.offSeason?.months)) {
        block += `Current season: OFF SEASON — ${si.offSeason.reality || ''}\n`;
        if (si.offSeason.hiddenGem) block += `Hidden gem of this season: ${si.offSeason.hiddenGem}\n`;
      } else if (si.shoulderSeason?.months) {
        block += `Current season: SHOULDER — ${si.shoulderSeason.why || ''}\n`;
      }
    }

    // 32. COMMON REGRETS — prevent them proactively
    if (k.commonRegrets?.length) {
      block += `\nCOMMON REGRETS TO PREVENT:\n`;
      k.commonRegrets.forEach(r => block += `- ${r}\n`);
      block += `INSTRUCTION: Each of these regrets should be actively prevented in the itinerary. If Day 2 would normally lead to regret #1, restructure Day 2.\n`;
    }

    // 33. WHO THIS IS NOT FOR — honest mismatch check
    if (k.whoThisIsNotFor?.length) {
      const req_lower = (trip.specialRequest || '').toLowerCase();
      const style_lower = (trip.travelStyle || '').toLowerCase();
      block += `\nHONEST DESTINATION FIT:\n`;
      k.whoThisIsNotFor.slice(0, 2).forEach(w => block += `- ${w}\n`);
      block += `INSTRUCTION: If the traveler's request clearly matches a mismatch warning above, acknowledge it briefly at the start of the itinerary. This is what makes SKYmora trustworthy.\n`;
    }

    // 34. RESIDENT SUNDAY — local's real day
    if (k.residentSunday) {
      block += `\nRESIDENT SUNDAY (what a local does with one free day):\n${k.residentSunday}\n`;
      block += `INSTRUCTION: Use this as the reference for what 'local' looks and feels like here. At least one activity per day should draw from this local DNA.\n`;
    }

    // 35. HONEST TRUTH — the one line that sounds like a specialist
    if (k.honestTruth) {
      block += `\nTHE HONEST TRUTH ABOUT ${dest.toUpperCase()}:\n"${k.honestTruth}"\n`;
      block += `INSTRUCTION: Weave this truth naturally into the itinerary — not as a warning, as context.\n`;
    }
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

// loadDestination is already exported inline above
