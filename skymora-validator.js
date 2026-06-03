// ==========================================================
// SKYmora GOD-TIER INTELLIGENCE ENGINE
// File: skymora-validator.js  
// The world's most human + intelligent travel validator
// Combines: Emotional Arc + Micro Luxury + Memory Moments
//           + Experience DNA + Warm Human Messages
//           + Rich Alternatives + Specific Saving Tips
// ==========================================================

// ==========================================================
// 1. CURRENCY ENGINE
// ==========================================================
const CURRENCY_TO_USD = {
  USD: 1, INR: 0.012, EUR: 1.08, GBP: 1.27,
  AED: 0.272, CAD: 0.74, AUD: 0.65, SGD: 0.74,
  JPY: 0.0067, CHF: 1.13
};

function toUSD(amount, currency = "USD") {
  return Number(amount || 0) * (CURRENCY_TO_USD[currency] || 1);
}

// ==========================================================
// 2. SEASONAL INTELLIGENCE
// ==========================================================
const SEASON_RULES = {
  paris: { peakMonths:[6,7,8,12], rainyMonths:[11,12], romanticMonths:[4,5,9], expensiveMonths:[6,7,8,12] },
  london: { peakMonths:[6,7,8], coldMonths:[12,1,2], expensiveMonths:[6,7,8,12] },
  bali: { monsoonMonths:[12,1,2], bestMonths:[5,6,7,8], peakMonths:[7,8] },
  maldives: { peakMonths:[12,1,2,3], monsoonMonths:[5,6,7,8,9,10] },
  rishikesh: { monsoonMonths:[7,8], bestMonths:[10,11,2,3] },
  ladakh: { closedRoadMonths:[1,2,12], bestMonths:[6,7,8] },
  goa: { peakMonths:[12,1,2], monsoonMonths:[6,7,8,9] },
  dubai: { hotMonths:[6,7,8,9], peakMonths:[11,12,1,2,3] },
  "new york": { peakMonths:[6,7,8,12], coldMonths:[1,2] },
  tokyo: { peakMonths:[3,4,10,11], cherryBlossomMonths:[3,4] },
  singapore: { hotMonths:[5,6,7], peakMonths:[12,1] },
  istanbul: { peakMonths:[6,7,8], bestMonths:[4,5,9,10] }
};

function getMonth(dateString) {
  if (!dateString) return new Date().getMonth() + 1;
  return new Date(dateString).getMonth() + 1;
}

function analyzeSeason(destination, departureDate) {
  const month = getMonth(departureDate);
  const dest = (destination || "").toLowerCase();
  const warnings = [], opportunities = [], bonuses = [];

  for (const [city, rules] of Object.entries(SEASON_RULES)) {
    if (!dest.includes(city)) continue;

    if (rules.monsoonMonths?.includes(month)) {
      warnings.push(`${destination} experiences monsoon conditions this month — outdoor sightseeing may be limited on some days.`);
      opportunities.push(`Luxury hotels drop prices 30-50% during monsoon season — your budget goes significantly further.`);
    }
    if (rules.closedRoadMonths?.includes(month)) {
      warnings.push(`Some road routes to ${destination} may be restricted this month due to weather.`);
    }
    if (rules.peakMonths?.includes(month) || rules.expensiveMonths?.includes(month)) {
      warnings.push(`${destination} is in peak season — flights and hotels run 25-40% higher than average.`);
      opportunities.push(`Book at least 6 weeks in advance to secure better rates before peak pricing kicks in fully.`);
    }
    if (rules.hotMonths?.includes(month)) {
      warnings.push(`${destination} is extremely hot this month — plan outdoor activities before 10am or after 5pm.`);
      opportunities.push(`Indoor attractions, museums, and malls are excellent options during the heat of the day.`);
    }
    if (rules.romanticMonths?.includes(month)) {
      bonuses.push(`${destination} is emotionally magical during this season — perfect timing for your journey.`);
    }
    if (rules.bestMonths?.includes(month)) {
      bonuses.push(`You've chosen one of the finest months to visit ${destination} — exceptional timing.`);
    }
    if (rules.cherryBlossomMonths?.includes(month)) {
      bonuses.push(`Cherry blossom season in ${destination} — one of the most beautiful spectacles in the world.`);
    }
  }

  return { warnings, opportunities, bonuses, seasonalRisk: warnings.length > 0 };
}

// ==========================================================
// 3. DESTINATION TIERS
// ==========================================================
const INDIA_DOMESTIC_CITIES = [
  "rishikesh","haridwar","mussoorie","nainital","jim corbett","auli","kedarnath","badrinath",
  "valley of flowers","manali","shimla","dharamshala","mcleod ganj","spiti","kasol","bir billing",
  "jaipur","jodhpur","udaipur","jaisalmer","pushkar","bikaner","ranthambore","mount abu","kumbhalgarh","chittorgarh",
  "kochi","munnar","alleppey","thekkady","varkala","wayanad","kovalam","kumarakom",
  "bangalore","mysore","coorg","hampi","gokarna","kabini","chikmagalur",
  "mumbai","pune","lonavala","mahabaleshwar","nasik","aurangabad","ajanta","ellora",
  "goa","panaji","calangute","palolem",
  "varanasi","agra","lucknow","prayagraj","ayodhya","mathura","vrindavan",
  "delhi","new delhi",
  "leh","ladakh","nubra","pangong","zanskar","srinagar","gulmarg","pahalgam",
  "kolkata","darjeeling","gangtok","sikkim","shillong","cherrapunji","kaziranga","majuli",
  "puri","bhubaneswar","konark","chilika",
  "ahmedabad","rann of kutch","gir","diu","dwarka","somnath","palitana",
  "amritsar","chandigarh","wagah",
  "khajuraho","orchha","bhopal","indore","pachmarhi","ujjain",
  "hyderabad","vizag","tirupati","araku",
  "chennai","madurai","ooty","kodaikanal","pondicherry","mahabalipuram","rameswaram","kanyakumari",
  "havelock island","andaman","port blair","neil island",
  "rishikesh","haridwar"
];

const DESTINATION_TIERS = {
  india_domestic: {
    cities: INDIA_DOMESTIC_CITIES,
    // No international flight — train/bus within India
    flightFromIndia: 30, flightFromUS: 0, flightFromEurope: 0, // INR 2,500 avg domestic flight or train ₹400-1200
    hotelBudget: 6, hotelMid: 18, hotelLuxury: 80,  // USD equivalent: budget ₹500, mid ₹1500, luxury ₹6500/night
    foodBudget: 4, foodMid: 10, transport: 3, activities: 8  // INR ~300 food/day budget tier
  },
  budget: {
    cities: ["bangkok","bali","kathmandu","hanoi","colombo","ho chi minh"],
    flightFromIndia: 120, flightFromUS: 700, flightFromEurope: 500,
    hotelBudget: 18, hotelMid: 55, hotelLuxury: 180,
    foodBudget: 10, foodMid: 25, transport: 7, activities: 20
  },
  mid: {
    cities: ["istanbul","rome","barcelona","tokyo","osaka","dubai","singapore","seoul",
             "prague","budapest","lisbon","vienna","amsterdam","berlin","athens","cairo",
             "marrakech","kuala lumpur","hong kong","mexico city","cancun"],
    flightFromIndia: 450, flightFromUS: 900, flightFromEurope: 220,
    hotelBudget: 50, hotelMid: 140, hotelLuxury: 420,
    foodBudget: 20, foodMid: 45, transport: 15, activities: 40
  },
  premium: {
    cities: ["paris","london","zurich","new york","maldives","seychelles","bora bora",
             "monaco","geneva","los angeles","sydney","toronto","oslo","stockholm",
             "copenhagen","reykjavik","san francisco","melbourne"],
    flightFromIndia: 750, flightFromUS: 350, flightFromEurope: 170,
    hotelBudget: 110, hotelMid: 260, hotelLuxury: 850,
    foodBudget: 35, foodMid: 90, transport: 30, activities: 65
  }
};

function getDestinationTier(destination = "") {
  const dest = destination.toLowerCase();
  for (const [tierName, tier] of Object.entries(DESTINATION_TIERS)) {
    if (tier.cities.some(city => dest.includes(city) || city.includes(dest.split(" ")[0]))) {
      return { tierName, tier };
    }
  }
  return { tierName: "mid", tier: DESTINATION_TIERS.mid };
}

function getDepartureRegion(departure = "") {
  const dep = departure.toLowerCase();
  const india = ["delhi","mumbai","bangalore","chennai","kolkata","hyderabad","india","pune","ahmedabad","bombay"];
  const us = ["new york","los angeles","chicago","miami","america","usa","seattle","boston","houston"];
  const europe = ["paris","berlin","rome","london","europe","amsterdam","frankfurt","zurich","madrid"];
  if (india.some(k => dep.includes(k))) return "india";
  if (us.some(k => dep.includes(k))) return "us";
  if (europe.some(k => dep.includes(k))) return "europe";
  return "india";
}

// ==========================================================
// 4. FLIGHT MULTIPLIER
// ==========================================================
function getFlightMultiplier(month) {
  if ([6,7,8,12].includes(month)) return 1.35;
  if ([1,2].includes(month)) return 0.85;
  if ([3,4,10,11].includes(month)) return 1.15;
  return 1.0;
}

// ==========================================================
// 5. PERSONA ENGINE
// ==========================================================
function detectPersona(trip = {}) {
  const style = (trip.travelStyle || "").toLowerCase();
  const request = (trip.specialRequest || "").toLowerCase();
  const adults = Number(trip.adults || 1);
  const children = Number(trip.children || 0);

  if (style.includes("luxury") || style.includes("elite")) return "luxury";
  if (request.includes("honeymoon") || request.includes("romantic")) return "couple";
  if (request.includes("photo") || request.includes("photography")) return "photographer";
  if (request.includes("food") || request.includes("culinary")) return "foodie";
  if (request.includes("adventure") || style.includes("adventure")) return "adventurer";
  if (children > 0) return "family";
  if (adults === 1) return "solo";
  return "explorer";
}

const PERSONA_SOUL = {
  luxury: { note: "Every recommendation prioritizes quality and exclusivity over quantity.", icon: "💎" },
  couple: { note: "Romantic settings, sunset moments, and intimate experiences lead every day.", icon: "💑" },
  photographer: { note: "Golden hour timings, most photogenic routes, and camera-perfect moments are woven throughout.", icon: "📸" },
  foodie: { note: "The finest local markets, street food gems, and authentic restaurants lead each day.", icon: "🍜" },
  adventurer: { note: "Active experiences, hidden trails, and off-the-beaten-path discoveries fill this journey.", icon: "🏔️" },
  family: { note: "Child-friendly pacing, rest breaks, and family accommodation are prioritized throughout.", icon: "👨‍👩‍👧" },
  solo: { note: "Safe neighborhoods, social spaces, and solo traveler insider tips are included at every step.", icon: "🧳" },
  explorer: { note: "A perfect balance of iconic landmarks and hidden local experiences fills each day.", icon: "🌍" }
};

// ==========================================================
// 6. EMOTIONAL ARC ENGINE (unique differentiator)
// ==========================================================
function buildEmotionalArc(days = 3, destination = "", persona = "explorer") {
  const arc = [];

  for (let day = 1; day <= days; day++) {
    if (day === 1) {
      arc.push({
        day,
        emotion: "arrival_wonder",
        energy: "gentle",
        directive: `First magical emotional connection with ${destination} — arrive, breathe, absorb, do not rush.`,
        pace: "slow"
      });
    } else if (day === days && days > 1) {
      arc.push({
        day,
        emotion: "farewell_fullness",
        energy: "reflective",
        directive: `Leave ${destination} emotionally fulfilled — one last slow walk, one final coffee, one memory to carry home forever.`,
        pace: "slow"
      });
    } else if (day === Math.ceil(days / 2)) {
      arc.push({
        day,
        emotion: "peak_wonder",
        energy: "maximum",
        directive: `The emotional peak of the journey — the day that becomes the memory you tell people about for years.`,
        pace: "full"
      });
    } else {
      arc.push({
        day,
        emotion: "discovery",
        energy: "high",
        directive: `Active discovery — let ${destination} surprise you with something you did not expect.`,
        pace: "moderate"
      });
    }
  }

  return arc;
}

// ==========================================================
// 7. MICRO LUXURY ENGINE (unique differentiator)
// ==========================================================
function generateMicroLuxury(destination, persona) {
  const moments = [];

  moments.push(`Wake up before sunrise at least once — ${destination} reveals a completely different emotional version of itself before the world wakes up.`);
  moments.push(`Spend one evening without any schedule — no maps, no reservations, no goals. Simply walk and let ${destination} lead you somewhere unexpected.`);
  moments.push(`Find one café far from tourist streets, sit for 30 minutes, order nothing expensive, and simply watch how local life flows.`);

  if (persona === "solo") {
    moments.push(`Have one completely silent solo meal without your phone — this single moment becomes transformational for most solo travelers.`);
  }
  if (persona === "couple") {
    moments.push(`Take one completely unplanned walk together at night without maps — some of the most romantic moments in travel are unscheduled.`);
  }
  if (persona === "photographer") {
    moments.push(`Arrive at one location 45 minutes before golden hour and simply wait — the patience always rewards with extraordinary light.`);
  }
  if (persona === "family") {
    moments.push(`Give children one moment each day to lead — let them pick the direction or the café. Their instincts for joy are remarkable.`);
  }
  if (persona === "foodie") {
    moments.push(`Follow your nose once — if something smells extraordinary from a street stall, stop immediately regardless of what is scheduled.`);
  }

  return moments;
}

// ==========================================================
// 8. MEMORY MOMENTS ENGINE (unique differentiator)
// ==========================================================
function buildMemoryMoments(destination, persona) {
  const moments = [];

  moments.push({ type: "sunrise", text: `Experience ${destination} at sunrise at least once — cities carry a rare emotional silence before 7am that changes everything.` });
  moments.push({ type: "night_wander", text: `${destination} transforms emotionally after dark — dedicate one slow evening entirely to wandering without a destination.` });
  moments.push({ type: "local_connection", text: `Have one real conversation with a local — a shopkeeper, a café owner, a rickshaw driver. These five-minute moments often become the stories you tell for years.` });

  if (persona === "photographer") {
    moments.push({ type: "golden_hour", text: `Golden hour photography in ${destination} creates images that look unlike anything taken at any other time of day.` });
  }
  if (persona === "couple") {
    moments.push({ type: "romantic_ritual", text: `Create one small private ritual together in ${destination} — a specific café every morning, a sunset spot, a phrase only you two understand.` });
  }

  return moments;
}

// ==========================================================
// 9. EXPERIENCE DNA SCORE
// ==========================================================
function calculateExperienceDNA(comfortScore, persona, days) {
  let emotionalBalance = 90;
  let realism = 95;
  let authenticity = 92;

  if (["couple","photographer","foodie"].includes(persona)) authenticity += 5;
  if (days >= 5) emotionalBalance += 5;
  if (comfortScore > 110) realism += 5;

  const score = Math.max(1, Math.min(100, Math.round(
    (comfortScore * 0.35) +
    (emotionalBalance * 0.25) +
    (realism * 0.20) +
    (authenticity * 0.20)
  )));

  let rating = "Excellent";
  if (score >= 95) rating = "Legendary ✨";
  else if (score >= 85) rating = "World-Class 🌟";
  else if (score >= 70) rating = "Outstanding 🎯";
  else if (score >= 55) rating = "Strong 💪";

  return { score, rating };
}

// ==========================================================
// 10. IMPOSSIBLE REQUEST CHECKER
// ==========================================================
const IMPOSSIBLE_COMBOS = [
  { keywords:["scuba","diving","snorkel"], blocked:["paris","london","berlin","prague","delhi","agra","moscow","new york","vienna","budapest"] },
  { keywords:["ski","skiing","snowboard"], blocked:["dubai","bangkok","bali","goa","maldives","singapore","miami","cairo"] },
  { keywords:["safari","wildlife safari"], blocked:["paris","london","new york","tokyo","singapore","dubai"] },
  { keywords:["aurora","northern lights"], blocked:["paris","dubai","bangkok","bali","goa","singapore","new york","london","rome"] }
];

function checkImpossibleRequests(destination, specialRequest) {
  if (!specialRequest) return { hasIssues: false, issues: [] };
  const dest = destination.toLowerCase();
  const req = specialRequest.toLowerCase();
  const issues = [];

  for (const combo of IMPOSSIBLE_COMBOS) {
    const keyword = combo.keywords.find(k => req.includes(k));
    if (!keyword) continue;
    if (combo.blocked.some(c => dest.includes(c))) {
      issues.push({ activity: keyword, destination });
    }
  }
  return { hasIssues: issues.length > 0, issues };
}

// ==========================================================
// 11. COST CALCULATOR
// ==========================================================
function calculateCost(trip) {
  const {
    departure, destination,
    adults = 1, children = 0,
    tripDays = 3, budget = 0, currency = "USD",
    departureDate, travelStyle = "", specialRequest = ""
  } = trip;

  const month = getMonth(departureDate);
  const multiplier = getFlightMultiplier(month);
  const { tierName, tier } = getDestinationTier(destination);
  const region = getDepartureRegion(departure);
  const budgetUSD = toUSD(budget, currency);
  const days = Number(tripDays);
  const adultCount = Number(adults);
  const childCount = Number(children);

  // Detect India domestic trip — departure from India + destination is Indian city
  const isDomesticIndia = tierName === 'india_domestic' && region === 'india';

  const flightKey = region === "india" ? "flightFromIndia" : region === "us" ? "flightFromUS" : "flightFromEurope";
  // Domestic India: use train/bus cost not international flight
  const flightPerAdult = isDomesticIndia ? tier.flightFromIndia * 0.5 : tier[flightKey] * multiplier;
  const flights = flightPerAdult * adultCount + (flightPerAdult * 0.75 * childCount);

  let hotelType = "hotelBudget";
  const style = travelStyle.toLowerCase();
  const req = specialRequest.toLowerCase();
  if (style.includes("luxury") || style.includes("elite") || req.includes("5 star")) hotelType = "hotelLuxury";
  else if (style.includes("comfort") || req.includes("4 star")) hotelType = "hotelMid";

  const hotels = tier[hotelType] * days;
  const food = tier.foodBudget * (adultCount + childCount * 0.7) * days;
  const transport = tier.transport * days;
  const activities = tier.activities * adultCount * days * 0.35;
  const estimatedCost = flights + hotels + food + transport + activities;
  const absoluteMinimum = tier[flightKey] * adultCount + tier.hotelBudget * days +
    tier.foodBudget * (adultCount + childCount * 0.7) * days + tier.transport * days;
  const comfortScore = Math.round((budgetUSD / estimatedCost) * 100);

  return {
    budgetUSD, tierName, hotelType,
    estimatedCost: Math.round(estimatedCost),
    absoluteMinimum: Math.round(absoluteMinimum),
    feasible: budgetUSD >= absoluteMinimum,
    comfortable: budgetUSD >= estimatedCost,
    comfortScore,
    shortfall: Math.round(estimatedCost - budgetUSD),
    surplus: Math.round(budgetUSD - estimatedCost),
    breakdown: {
      flights: Math.round(flights),
      hotels: Math.round(hotels),
      food: Math.round(food),
      transport: Math.round(transport),
      activities: Math.round(activities)
    }
  };
}

// ==========================================================
// 12. SAVING TIPS ENGINE
// ==========================================================
function buildSavingTips(trip, analysis, persona) {
  const { breakdown, budgetUSD, tierName } = analysis;
  const { destination, tripDays, currency, budget, adults } = trip;
  const tips = [];

  if (breakdown.flights > budgetUSD * 0.35) {
    tips.push(`✈️ Tuesday and Wednesday departures are typically 15-20% cheaper — same experience, smarter price`);
    tips.push(`✈️ A 1-stop flight instead of direct saves 25-35% on long-haul routes like yours — and the layover can be a mini-adventure`);
    tips.push(`✈️ Searching flexible dates ±3 days unlocks significantly lower fares — even 1 day shift can save $50-100`);
  }

  tips.push(`🏨 Staying 2-3km from the tourist core cuts hotel prices 35-45% — the metro makes location irrelevant`);
  if (tierName === "premium") {
    tips.push(`🏨 Boutique hotels and serviced apartments in ${destination} often deliver better character and value than chain hotels`);
  }

  if (persona === "foodie") {
    tips.push(`🍜 The most extraordinary food in ${destination} is almost never in the tourist zone — the real kitchens are 3 streets behind`);
  } else {
    tips.push(`🍜 Street breakfast, local lunch under $8, one proper dinner — this rhythm saves $25-35 per day without sacrificing experience`);
  }

  tips.push(`🚇 A weekly metro or transit pass almost always beats per-ride tickets — typically saves $15-20 over ${tripDays} days`);

  if (Number(tripDays) > 3 && analysis.shortfall > 0) {
    const reducedDays = Math.max(2, Number(tripDays) - 1);
    const savingPerDay = Math.round((breakdown.hotels + breakdown.food) / Number(tripDays));
    tips.push(`📅 ${reducedDays} days in ${destination} still covers every highlight — and the $${savingPerDay * (Number(tripDays) - reducedDays)} saved can upgrade your flight or hotel meaningfully`);
  }

  if (persona === "solo") {
    tips.push(`🧳 Join one free walking tour — meet fellow travelers, save money on a guide, and discover hidden spots no guidebook mentions`);
  }
  if (persona === "family") {
    tips.push(`👨‍👩‍👧 Children under 12 enter most major museums free — verify before purchasing family passes`);
  }
  if (persona === "photographer") {
    tips.push(`📸 The most photogenic spots cost nothing — golden hour at a viewpoint beats any paid attraction`);
  }

  return tips.slice(0, 6);
}

// ==========================================================
// 13. ALTERNATIVE DESTINATIONS
// ==========================================================
function buildAlternatives(trip, analysis) {
  const { budgetUSD } = analysis;
  const { currency, budget } = trip;
  const region = getDepartureRegion(trip.departure);
  const persona = detectPersona(trip);
  const alts = [];

  if (region === "india") {
    if (budgetUSD < 300) {
      alts.push({ dest: "Rishikesh", emoji: "🏔️", reason: "Mountains, spirituality, river cafés, rafting, yoga, and some of the most beautiful sunsets in India", budget: `₹8,000–15,000` });
      alts.push({ dest: "Goa", emoji: "🏖️", reason: "Beach life, Portuguese heritage, incredible seafood, and a luxury feeling at a fraction of international costs", budget: `₹15,000–25,000` });
      alts.push({ dest: "Udaipur", emoji: "🏰", reason: "Lake palaces, rooftop restaurants, royal culture — Rajasthan's most romantic city", budget: `₹12,000–20,000` });
    } else if (budgetUSD < 800) {
      alts.push({ dest: "Bangkok", emoji: "🏯", reason: "World-class street food, gleaming temples, electric nightlife — maximum experience per rupee of any international destination", budget: `₹35,000–50,000` });
      alts.push({ dest: "Bali", emoji: "🌺", reason: "Rice terraces, temple ceremonies, beach clubs, wellness retreats — genuinely magical and perfectly priced", budget: `₹40,000–60,000` });
      alts.push({ dest: "Sri Lanka", emoji: "🐘", reason: "Eight UNESCO sites, pristine beaches, extraordinary wildlife — and no complicated visa process from India", budget: `₹30,000–45,000` });
    } else if (budgetUSD < 1500) {
      alts.push({ dest: "Dubai", emoji: "🌆", reason: "Desert adventures, world records, luxury shopping, 5-star experiences — and India flights run daily with great prices", budget: `₹70,000–1,00,000` });
      alts.push({ dest: "Istanbul", emoji: "🕌", reason: "Two continents, 3,000 years of history, legendary cuisine, and one of the most visually extraordinary cities on earth", budget: `₹60,000–85,000` });
      alts.push({ dest: "Singapore", emoji: "🌃", reason: "Futuristic gardens, world-famous hawker food, absolute safety, efficiency — the perfect first international experience", budget: `₹65,000–90,000` });
    } else {
      alts.push({ dest: "Tokyo", emoji: "🗼", reason: "The most organized, extraordinary, and emotionally immersive city on earth — unlike anywhere else", budget: `₹1,20,000–1,80,000` });
      alts.push({ dest: "Rome", emoji: "🏛️", reason: "2,000 years of history walking distance apart — the Colosseum, Vatican, and the world's best pasta", budget: `₹1,10,000–1,60,000` });
    }
  }

  return alts.slice(0, 3);
}

// ==========================================================
// 14. WARM MESSAGE BUILDER
// ==========================================================
function buildWarmMessage(validation, trip) {
  const { analysis, persona, seasonal, impossibleCheck, travelerName, experienceDNA } = validation;
  const { destination, budget, currency, tripDays, adults } = trip;
  const budgetDisplay = `${currency} ${Number(budget).toLocaleString()}`;
  const personaSoul = PERSONA_SOUL[persona] || PERSONA_SOUL.explorer;

  // CASE 1 — PERFECT CONDITIONS
  if (analysis.feasible && analysis.comfortable && !impossibleCheck.hasIssues && !seasonal.seasonalRisk) {
    return {
      type: "approved",
      headline: `${destination} in ${tripDays} Days — Let's Make It Extraordinary ✅`,
      intro: `${travelerName}, your budget of ${budgetDisplay} is beautifully suited for this journey. ${personaSoul.icon} ${personaSoul.note}`,
      personaNote: personaSoul.note,
      proceedToItinerary: true
    };
  }

  // CASE 2 — FEASIBLE WITH SEASONAL WARNING
  if (analysis.feasible && analysis.comfortable && seasonal.seasonalRisk) {
    return {
      type: "approved_with_warnings",
      headline: `${destination} in ${tripDays} Days — A Few Things To Know First 🌟`,
      intro: `${travelerName}, your budget works beautifully for this trip. Before your itinerary, here are a few seasonal notes that will make your journey even better:`,
      seasonalWarnings: seasonal.warnings,
      seasonalOpportunities: seasonal.opportunities,
      seasonalBonuses: seasonal.bonuses,
      proceedToItinerary: true
    };
  }

  // CASE 3 — FEASIBLE BUT TIGHT
  if (analysis.feasible && !analysis.comfortable) {
    return {
      type: "tight_budget",
      headline: `${destination} in ${tripDays} Days — Possible With the Right Moves 🎯`,
      intro: `${travelerName}, your ${budgetDisplay} can work for ${destination} — but it needs thoughtful planning. Here is exactly how we make it happen beautifully:`,
      savingTips: buildSavingTips(trip, analysis, persona),
      seasonalNotes: seasonal.warnings,
      bonuses: seasonal.bonuses,
      proceedToItinerary: true,
      closingNote: `I have built your itinerary around every one of these principles. Every recommendation below is the finest experience at the smartest price — your ${destination} journey begins now.`
    };
  }

  // CASE 4 — NOT FEASIBLE
  if (!analysis.feasible) {
    return {
      type: "not_feasible",
      headline: `${destination} in ${tripDays} Days — Let Me Be Your Honest Friend 💛`,
      intro: `${travelerName}, I could generate a ${destination} itinerary right now — but it would be built on numbers that simply do not add up, and that would be a disservice to you. So let me be completely honest, and then show you something extraordinary.`,
      honestBreakdown: (()=>{
        // India domestic — show INR not USD
        const isDomestic = INDIA_DOMESTIC_CITIES.some(c => destination.toLowerCase().includes(c));
        if (isDomestic && (currency==='INR'||currency==='inr')) {
          const flightINR = Math.round(analysis.breakdown.flights * 83);
          const hotelINR = Math.round(analysis.breakdown.hotels * 83);
          const foodINR = Math.round(analysis.breakdown.food * 83);
          const transportINR = Math.round(analysis.breakdown.transport * 83);
          const totalINR = Math.round(analysis.absoluteMinimum * 83);
          return [
            `Here is the realistic cost of ${tripDays} days in ${destination} for ${adults} person(s):`,
            `🚂 Train/bus to ${destination}: approximately ₹${flightINR.toLocaleString('en-IN')}`,
            `🏨 Budget accommodation (${tripDays} nights): approximately ₹${hotelINR.toLocaleString('en-IN')}`,
            `🍽️ Meals (dhaba/local food): approximately ₹${foodINR.toLocaleString('en-IN')}`,
            `🛺 Local transport & auto: approximately ₹${transportINR.toLocaleString('en-IN')}`,
            `📊 Minimum realistic total: approximately ₹${totalINR.toLocaleString('en-IN')}`,
            `💰 Your current budget: ${budgetDisplay}`
          ];
        }
        return [
          `Here is the transparent reality of ${tripDays} days in ${destination} for ${adults} adult(s):`,
          `✈️ Return flights: approximately $${analysis.breakdown.flights}${analysis.breakdown.flights > analysis.budgetUSD ? " — this alone exceeds your entire budget" : ""}`,
          `🏨 Budget accommodation (${tripDays} nights): approximately $${analysis.breakdown.hotels}`,
          `🍜 Meals (budget-conscious): approximately $${analysis.breakdown.food}`,
          `🚇 Local transport: approximately $${analysis.breakdown.transport}`,
          `📊 Minimum realistic total: approximately $${analysis.absoluteMinimum}`,
          `💰 Your current budget: ${budgetDisplay} (approximately $${Math.round(analysis.budgetUSD)})`
        ];
      })(),
      savingTips: buildSavingTips(trip, analysis, persona),
      alternatives: buildAlternatives(trip, analysis),
      encouragement: `${travelerName}, your desire to travel is your greatest asset. With the same ${budgetDisplay} and the same passion, I can build you an experience that will genuinely take your breath away — in destinations where your budget creates something extraordinary. Tell me to proceed and I build it immediately. 💛`,
      proceedToItinerary: false
    };
  }

  // CASE 5 — IMPOSSIBLE REQUEST ADJUSTMENT
  if (impossibleCheck.hasIssues) {
    return {
      type: "request_adjusted",
      headline: `${destination} in ${tripDays} Days — With One Small Note 🌟`,
      intro: `${travelerName}, your itinerary is ready and I'm excited to share it with you! Before we begin, one small note about your special request:`,
      adjustments: impossibleCheck.issues.map(i => ({
        requested: i.activity,
        note: `${destination} does not offer ${i.activity} — I have replaced it with the finest alternative that captures the same spirit of adventure and wonder.`
      })),
      proceedToItinerary: true
    };
  }

  return { type: "approved", proceedToItinerary: true };
}

// ==========================================================
// 15. MASTER EXPORT
// ==========================================================
export function validateTrip(trip) {
  const travelerName = trip.nickname || (trip.name || "Friend").split(" ")[0];
  const persona = detectPersona(trip);
  const analysis = calculateCost(trip);
  const seasonal = analyzeSeason(trip.destination, trip.departureDate);
  const impossibleCheck = checkImpossibleRequests(trip.destination, trip.specialRequest);
  const emotionalArc = buildEmotionalArc(Number(trip.tripDays || 3), trip.destination, persona);
  const microLuxury = generateMicroLuxury(trip.destination, persona);
  const memoryMoments = buildMemoryMoments(trip.destination, persona);
  const experienceDNA = calculateExperienceDNA(analysis.comfortScore, persona, Number(trip.tripDays || 3));
  const personaSoul = PERSONA_SOUL[persona] || PERSONA_SOUL.explorer;

  const validation = {
    travelerName, persona, analysis, seasonal,
    impossibleCheck, emotionalArc, microLuxury,
    memoryMoments, experienceDNA, personaSoul,
    feasible: analysis.feasible,
    comfortable: analysis.comfortable
  };

  validation.message = buildWarmMessage(validation, trip);

  console.log(`🧠 SKYmora Intelligence — Persona: ${persona} | Tier: ${analysis.tierName} | Feasible: ${analysis.feasible} | Comfort: ${analysis.comfortScore}% | DNA: ${experienceDNA.rating} | Type: ${validation.message.type}`);

  return validation;
}

// ==========================================================
// 16. REJECTION CONTENT BUILDER (for server.js)
// ==========================================================
export function buildRejectionItinerary(validation, trip) {
  const { message, analysis, seasonal, microLuxury, emotionalArc } = validation;
  const { currency, budget } = trip;
  const budgetDisplay = `${currency} ${Number(budget).toLocaleString()}`;
  let content = "";

  if (message.intro) content += message.intro + "\n\n";
  if (message.honestBreakdown) content += message.honestBreakdown.join("\n\n") + "\n\n";

  if (seasonal.seasonalRisk && seasonal.warnings.length > 0) {
    content += `\n\n⚠️ SEASONAL NOTES:\n\n${seasonal.warnings.join("\n\n")}`;
    if (seasonal.opportunities.length > 0) {
      content += `\n\n💡 SILVER LINING:\n\n${seasonal.opportunities.join("\n\n")}`;
    }
  }

  if (message.savingTips?.length > 0) {
    content += `\n\n=== HOW TO MAKE IT WORK ===\n\n${message.savingTips.join("\n\n")}`;
  }

  if (message.alternatives?.length > 0) {
    content += `\n\n=== INCREDIBLE ALTERNATIVES WITHIN ${budgetDisplay} ===\n\n`;
    message.alternatives.forEach(alt => {
      content += `${alt.emoji} ${alt.dest}\n${alt.reason}\nApproximate budget: ${alt.budget}\n\n`;
    });
  }

  if (message.encouragement) content += `\n\n${message.encouragement}`;

  return content;
}