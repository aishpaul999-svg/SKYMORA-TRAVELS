// Create 11 wildly different itineraries via /api/generate, using every option
// available in the trip-creation interface, covering easy -> extreme scenarios.
import fs from "fs";

const BASE = "http://localhost:3000";

const TRIPS = [
  {
    label: "1_solo_female_tokyo_packed",
    name: "Maya Tan", nickname: "Maya", departure: "Singapore", destination: "Tokyo, Japan",
    tripType: "return", departureDate: "2026-09-10", returnDate: "2026-09-15",
    depTime: "Morning", retTime: "Evening", travelStyle: "Cultural Discoveries 🏛️,City Life & Nightlife 🌆,Food & Wine Journeys 🍷",
    specialRequest: "First time alone abroad, a bit nervous, want safe but exciting neighborhoods, love street food",
    budget: 1500, currency: "USD", adults: 1, children: 0, infants: 0, tripDays: 5,
    firstVisit: "first", travelPace: "packed", travelerExperience: "first_intl",
    emotionalState: "exploring", diningDepth: "every_meal", socialComfort: "meet_people",
    travelPersonality: "extrovert", planningStyle: "planner",
    agentData: { name: "Sophia Bennett" }
  },
  {
    label: "2_honeymoon_maldives_luxury",
    name: "Arjun Mehta", nickname: "Arjun", departure: "Mumbai, India", destination: "Maldives",
    tripType: "return", departureDate: "2026-12-20", returnDate: "2026-12-25",
    depTime: "Afternoon", retTime: "Morning", travelStyle: "Luxury Escapes ✨,Romantic Journeys 💞,Beach Retreats 🏖️",
    specialRequest: "Honeymoon — want overwater villa, private dinners, surprise champagne setup, no crowds",
    budget: 6000, currency: "USD", adults: 2, children: 0, infants: 0, tripDays: 5,
    firstVisit: "first", travelPace: "relaxed", travelerExperience: "experienced",
    emotionalState: "celebrating", diningDepth: "one_great", socialComfort: "balanced",
    travelPersonality: "introvert", planningStyle: "balanced",
    agentData: { name: "Alexander Cruz" }
  },
  {
    label: "3_family_orlando_kids",
    name: "David Khan", nickname: "Dave", departure: "New York, USA", destination: "Orlando, Florida",
    tripType: "return", departureDate: "2026-07-01", returnDate: "2026-07-08",
    depTime: "Morning", retTime: "Evening", travelStyle: "Family Escapes 👨‍👩‍👧‍👦,Cultural Discoveries 🏛️",
    specialRequest: "Traveling with two kids ages 5 and 8, one has a peanut allergy, need stroller-friendly plans and pool time daily",
    budget: 4000, currency: "USD", adults: 2, children: 2, infants: 0, tripDays: 7,
    firstVisit: "first", travelPace: "balanced", travelerExperience: "moderate",
    emotionalState: "exploring", diningDepth: "balanced", socialComfort: "balanced",
    travelPersonality: "balanced", planningStyle: "planner",
    agentData: { name: "Noah Davis" }
  },
  {
    label: "4_senior_repeat_italy_glutenfree",
    name: "Eleanor Whitfield", nickname: "Ellie", departure: "London, UK", destination: "Rome, Italy",
    tripType: "return", departureDate: "2026-10-05", returnDate: "2026-10-19",
    depTime: "Morning", retTime: "Afternoon", travelStyle: "Cultural Discoveries 🏛️,Food & Wine Journeys 🍷,Historical Wonders 🏰",
    specialRequest: "We've been to Rome twice before, looking for deeper/local experiences this time. I'm celiac — strictly gluten-free meals only, and my husband has limited mobility (can't do long walking days)",
    budget: 8000, currency: "EUR", adults: 2, children: 0, infants: 0, tripDays: 14,
    firstVisit: "repeat", travelPace: "relaxed", travelerExperience: "experienced",
    emotionalState: "exploring", diningDepth: "every_meal", socialComfort: "balanced",
    travelPersonality: "introvert", planningStyle: "spontaneous",
    agentData: { name: "Liam Patel" }
  },
  {
    label: "5_solo_budget_backpacker_vietnam",
    name: "Jake Sullivan", nickname: "Jake", departure: "Sydney, Australia", destination: "Vietnam",
    tripType: "return", departureDate: "2026-08-01", returnDate: "2026-08-22",
    depTime: "Night", retTime: "Night", travelStyle: "Adventure Trails 🧭,Offbeat Hidden Gems 🗺️,Food & Wine Journeys 🍷",
    specialRequest: "Backpacking on a shoestring, hostels only, want to meet other travelers, open to night buses to save money",
    budget: 800, currency: "USD", adults: 1, children: 0, infants: 0, tripDays: 21,
    firstVisit: "first", travelPace: "packed", travelerExperience: "moderate",
    emotionalState: "escaping", diningDepth: "fuel", socialComfort: "meet_people",
    travelPersonality: "extrovert", planningStyle: "spontaneous",
    agentData: { name: "Emma Collins" }
  },
  {
    label: "6_friends_group_bali_nightlife",
    name: "Carlos Rivera", nickname: "Carlos", departure: "Los Angeles, USA", destination: "Bali, Indonesia",
    tripType: "return", departureDate: "2026-11-10", returnDate: "2026-11-18",
    depTime: "Evening", retTime: "Morning", travelStyle: "City Life & Nightlife 🌆,Beach Retreats 🏖️,Festivals & Local Events 🎭",
    specialRequest: "Group of 4 friends celebrating a 30th birthday, want beach clubs, nightlife, one big group dinner each night, also need 1 chill recovery day",
    budget: 5000, currency: "USD", adults: 4, children: 0, infants: 0, tripDays: 8,
    firstVisit: "first", travelPace: "packed", travelerExperience: "experienced",
    emotionalState: "celebrating", diningDepth: "every_meal", socialComfort: "meet_people",
    travelPersonality: "extrovert", planningStyle: "balanced",
    agentData: { name: "Ethan Roberts" }
  },
  {
    label: "7_ultraluxury_dubai_wellness",
    name: "Wei Chen", nickname: "Wei", departure: "Hong Kong", destination: "Dubai, UAE",
    tripType: "return", departureDate: "2026-09-25", returnDate: "2026-09-28",
    depTime: "Morning", retTime: "Night", travelStyle: "Luxury Escapes ✨,Wellness & Spa Retreats 💆‍♀️,Shopping Escapades 🛍️",
    specialRequest: "Burned out from work, want total recovery — private spa days, no group activities, private transfers only, 5-star or nothing",
    budget: 20000, currency: "AED", adults: 1, children: 0, infants: 0, tripDays: 3,
    firstVisit: "repeat", travelPace: "relaxed", travelerExperience: "experienced",
    emotionalState: "recovering", diningDepth: "one_great", socialComfort: "independent",
    travelPersonality: "introvert", planningStyle: "balanced",
    agentData: { name: "Alexander Cruz" }
  },
  {
    label: "8_trekkers_nepal_adventure",
    name: "Anna Kowalski", nickname: "Anna", departure: "Warsaw, Poland", destination: "Kathmandu, Nepal",
    tripType: "return", departureDate: "2026-10-15", returnDate: "2026-10-27",
    depTime: "Night", retTime: "Afternoon", travelStyle: "Mountain Getaways 🏔️,Adventure Trails 🧭,Wildlife & Safaris 🐘",
    specialRequest: "Want a serious trek (Annapurna or Everest base camp area), need acclimatization days planned, traveling with my partner who has asthma",
    budget: 3000, currency: "USD", adults: 2, children: 0, infants: 0, tripDays: 12,
    firstVisit: "first", travelPace: "packed", travelerExperience: "moderate",
    emotionalState: "exploring", diningDepth: "fuel", socialComfort: "balanced",
    travelPersonality: "balanced", planningStyle: "planner",
    agentData: { name: "Noah Davis" }
  },
  {
    label: "9_accessible_paris_wheelchair",
    name: "Sam Whitaker", nickname: "Sam", departure: "Toronto, Canada", destination: "Paris, France",
    tripType: "return", departureDate: "2026-09-05", returnDate: "2026-09-11",
    depTime: "Morning", retTime: "Evening", travelStyle: "Cultural Discoveries 🏛️,Food & Wine Journeys 🍷,Historical Wonders 🏰",
    specialRequest: "I use a wheelchair full-time. Need fully wheelchair-accessible hotels, transport, and attractions only — please double-check accessibility before suggesting anything. Traveling with my sister.",
    budget: 4500, currency: "EUR", adults: 2, children: 0, infants: 0, tripDays: 6,
    firstVisit: "first", travelPace: "balanced", travelerExperience: "moderate",
    emotionalState: "exploring", diningDepth: "balanced", socialComfort: "balanced",
    travelPersonality: "balanced", planningStyle: "planner",
    agentData: { name: "Sophia Bennett" }
  },
  {
    label: "10_extreme_edge_megagroup_lowbudget",
    name: "Fatima Al-Sayed", nickname: "Fatima", departure: "Cairo, Egypt", destination: "Switzerland",
    tripType: "return", departureDate: "2026-12-01", returnDate: "2026-12-31",
    depTime: "Morning", retTime: "Evening", travelStyle: "Mountain Getaways 🏔️,Luxury Escapes ✨",
    specialRequest: "Big extended family trip — please make it work somehow, we really want Switzerland",
    budget: 600, currency: "USD", adults: 6, children: 3, infants: 2, tripDays: 30,
    firstVisit: "first", travelPace: "packed", travelerExperience: "first_intl",
    emotionalState: "exploring", diningDepth: "fuel", socialComfort: "balanced",
    travelPersonality: "balanced", planningStyle: "spontaneous",
    agentData: { name: "Olivia Chen" }
  },
  {
    label: "11_digital_nomad_lisbon_longstay",
    name: "Priya Nair", nickname: "Priya", departure: "Bangalore, India", destination: "Lisbon, Portugal",
    tripType: "return", departureDate: "2026-09-01", returnDate: "2026-10-01",
    depTime: "Night", retTime: "Night", travelStyle: "City Life & Nightlife 🌆,Food & Wine Journeys 🍷,Countryside Charm 🌾",
    specialRequest: "Working remotely for most of the trip — need reliable wifi, a routine with co-working spaces on weekdays, and exploring on weekends. Also vegetarian.",
    budget: 3500, currency: "EUR", adults: 1, children: 0, infants: 0, tripDays: 30,
    firstVisit: "first", travelPace: "relaxed", travelerExperience: "experienced",
    emotionalState: "escaping", diningDepth: "every_meal", socialComfort: "meet_people",
    travelPersonality: "introvert", planningStyle: "spontaneous",
    agentData: { name: "Emma Collins" }
  }
];

async function pollProgress(tripId) {
  let allDays = [];
  let complete = false;
  let attempts = 0;
  while (!complete && attempts < 120) {
    await new Promise(r => setTimeout(r, 3000));
    const res = await fetch(`${BASE}/api/progress/${tripId}`);
    const data = await res.json();
    if (data.newDays?.length) allDays = allDays.concat(data.newDays);
    complete = data.complete;
    attempts++;
  }
  return { allDays, complete, attempts };
}

const meta = [];
for (const trip of TRIPS) {
  process.stdout.write(`\n=== Generating: ${trip.label} (${trip.destination}, ${trip.tripDays}d, ${trip.currency}${trip.budget}) ===\n`);
  const start = Date.now();
  let initial;
  try {
    const res = await fetch(`${BASE}/api/generate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(trip)
    });
    initial = await res.json();
  } catch (e) {
    process.stdout.write(`   ERROR generating: ${e?.message}\n`);
    meta.push({ ...trip, error: e?.message });
    continue;
  }

  const tripId = initial.tripId;
  let allDays = initial.itinerary || [];
  let complete = initial.complete;
  let validation = initial.validation || null;

  process.stdout.write(`   tripId=${tripId} | initial complete=${complete} | totalDays=${initial.totalDays}\n`);

  if (!complete && initial.partial) {
    const polled = await pollProgress(tripId);
    allDays = allDays.concat(polled.allDays);
    complete = polled.complete;
    process.stdout.write(`   polled ${polled.attempts} times, final complete=${complete}, total day-cards=${allDays.length}\n`);
  }

  const ms = Date.now() - start;
  process.stdout.write(`   done in ${(ms/1000).toFixed(1)}s\n`);

  meta.push({
    label: trip.label, tripId, trip, validation, complete,
    dayCount: allDays.length,
    itinerary: allDays
  });

  fs.writeFileSync(`./itin-${trip.label}.json`, JSON.stringify({ tripId, trip, validation, complete, itinerary: allDays }, null, 2));
}

fs.writeFileSync("./itineraries-meta.json", JSON.stringify(meta.map(m => ({
  label: m.label, tripId: m.tripId, dayCount: m.dayCount, complete: m.complete,
  destination: m.trip?.destination, validation: m.validation, error: m.error
})), null, 2));

console.log("\n\nALL DONE. Summary:");
for (const m of meta) {
  console.log(`${m.label} -> tripId=${m.tripId} days=${m.dayCount} complete=${m.complete} validation=${m.validation?.type || "ok"}`);
}
