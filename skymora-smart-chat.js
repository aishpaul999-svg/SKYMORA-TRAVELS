// ===============================
// SKYmora ULTRA-INTELLIGENT Travel AI (Smart brain)
// COMPREHENSIVE WORLD TRAVEL KNOWLEDGE + RAG + Router
// ALL BUGS FIXED - ALL CAPABILITIES PRESERVED
// ===============================

import dotenv from "dotenv";
dotenv.config();

import OpenAI from "openai";

// ===== GLOBAL SKYmora MODEL =====
export const MODEL = "gpt-4o-mini";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// ===============================
// COMPREHENSIVE WORLD TRAVEL KNOWLEDGE BASE
// ===============================

export const WORLD_KNOWLEDGE = {
  // Flight Intelligence
  flights: {
    booking: {
      bestTime: {
        international: "Book 3-6 months ahead for 20-40% savings",
        domestic: "Book 1-3 months ahead",
        sweetSpot: "8-12 weeks before = optimal price",
        lastMinute: "Rarely cheaper unless ultra-flexible"
      },
      cheapestDays: {
        departure: "Tuesday, Wednesday, Saturday (15-30% cheaper)",
        booking: "Tuesday 3PM EST (airlines release deals)",
        avoid: "Friday (business premium), Sunday (family travel)"
      },
      tools: {
        googleFlights: "Best price predictions (95% accuracy)",
        skyscanner: "Searches 100+ airlines, multi-city expert",
        momondo: "Includes budget carriers others miss",
        hopper: "AI predicts when to buy vs wait"
      },
      hacks: [
        "VPN to different countries (10-40% price difference)",
        "Book one-way separately if cheaper",
        "Check nearby airports (can save $100-300)",
        "Incognito mode prevents dynamic pricing",
        "±3 days flexibility = 30-50% savings",
        "Red-eye flights 20-30% cheaper",
        "Connecting flights booked separately sometimes cheaper",
        "Use points for premium at economy price"
      ]
    },
    comfort: {
      longHaul: {
        seats: {
          best: "Bulkhead (legroom but no under-seat storage)",
          worst: "Back rows (noise, no recline, bathroom)",
          free: "Exit rows (must assist in emergency)",
          worth: "Premium economy on 8+ hour flights"
        },
        essentials: [
          "Memory foam neck pillow",
          "Contoured eye mask for REM sleep",
          "Sony WH-1000XM5 or Bose QC45 headphones",
          "Compression socks (prevent DVT)",
          "Drink 250ml water/hour (cabin = 10-20% humidity)",
          "Melatonin 3mg (1hr before desired sleep)",
          "Moisturizer + lip balm",
          "Toothbrush after meals",
          "Change of underwear in carry-on"
        ],
        health: [
          "Walk every 2hrs (blood clots prevention)",
          "No alcohol (dehydrates 2x faster)",
          "Light meals (digestion slows at altitude)",
          "Ankle circles + leg stretches in seat",
          "Moisturize face every 2-3hrs"
        ]
      },
      withKids: {
        under2: [
          "Bassinet seats (front row, reserve early)",
          "Bottle for takeoff/landing (ear pressure)",
          "3x diapers you think you need",
          "Backup clothes for baby AND you",
          "White noise app for sleep"
        ],
        age2to5: [
          "iPad with DOWNLOADED content (no WiFi)",
          "New surprise toys every hour",
          "Individual snack bags",
          "Sticker books + washable markers",
          "Walk aisles every 30-45min"
        ],
        general: "Book night flights (kids sleep through)"
      }
    }
  },

  // Budget Mastery
  budgets: {
    USD: {
      ultraBudget: {
        daily: 30,
        desc: "Hostel dorms ($10), street food ($8), walking, free sites",
        where: "Southeast Asia, India, Eastern Europe",
        tips: "Couchsurf, volunteer for accommodation"
      },
      budget: {
        daily: 50,
        desc: "Budget hotel ($20), local food ($15), public transport ($5)",
        where: "Asia, Eastern Europe, Central America",
        tips: "Breakfast included, lunch specials, city cards"
      },
      midRange: {
        daily: 150,
        desc: "3-star hotel ($60), variety dining ($50), tours ($30)",
        where: "Western Europe, Japan, Australia",
        tips: "Book direct, Uber Pool, cook some meals"
      },
      comfortable: {
        daily: 250,
        desc: "4-star ($120), good restaurants ($80), guided tours ($40)",
        where: "Anywhere without worrying",
        tips: "Upgrade flights with points"
      },
      luxury: {
        daily: 500,
        desc: "5-star ($300), fine dining ($150), private experiences ($100)",
        where: "Premium experiences worldwide",
        tips: "Concierge, helicopters, Michelin dining"
      }
    },
    INR: {
      ultraBudget: {daily: 1000, desc: "Dharamshala (₹300), street food (₹300), local bus"},
      budget: {daily: 2500, desc: "Budget hotel (₹800), local restaurants (₹800)"},
      midRange: {daily: 6000, desc: "3-star (₹2500), variety dining (₹2000)"},
      comfortable: {daily: 12000, desc: "4-star (₹5000), good restaurants (₹4000)"},
      luxury: {daily: 25000, desc: "5-star/palace (₹12000), fine dining (₹8000)"}
    },
    EUR: {
      budget: {daily: 60, desc: "Budget hotel (€30), casual dining (€20)"},
      midRange: {daily: 150, desc: "3-star (€70), restaurants (€50)"},
      comfortable: {daily: 250, desc: "4-star (€120), nice dining (€80)"},
      luxury: {daily: 450, desc: "Boutique (€250), Michelin (€120)"}
    }
  },

  // Visa Masterclass
  visas: {
    usa: {
      esta: {
        who: "UK, Japan, Australia citizens (Visa Waiver countries)",
        cost: "$21",
        duration: "90 days",
        processing: "Instant (apply 72hrs before)",
        validity: "2 years multiple entries",
        url: "https://esta.cbp.dhs.gov"
      },
      b2: {
        who: "India, China, most countries",
        cost: "$185",
        duration: "6 months typical",
        processing: "Interview wait 30-90 days + 3-5 days passport",
        requirements: [
          "DS-160 form online",
          "Passport valid 6mo+",
          "Photo 2x2 white background",
          "Interview appointment",
          "Proof of home country ties (job, property, family)",
          "Bank statements 3-6 months",
          "Travel itinerary"
        ],
        tips: [
          "Book interview 2-3 months advance",
          "Be honest about tourism intent only",
          "Show strong home ties",
          "Have return ticket",
          "Dress professionally",
          "80-85% approval rate for first-time Indians"
        ]
      }
    },
    schengen: {
      basics: {
        covers: "27 countries: Austria, Belgium, Czech, Denmark, Estonia, Finland, France, Germany, Greece, Hungary, Iceland, Italy, Latvia, Lithuania, Luxembourg, Malta, Netherlands, Norway, Poland, Portugal, Slovakia, Slovenia, Spain, Sweden, Switzerland",
        duration: "90 days in any 180-day period",
        cost: "€80 (€40 kids 6-12, free under 6)",
        processing: "15 days official, up to 60 in peak (Jun-Aug)",
        applyWhere: "Embassy of FIRST entry country"
      },
      requirements: [
        "Application form",
        "Passport valid 3mo+ beyond trip",
        "Two photos 35x45mm recent",
        "Travel insurance €30,000+ coverage (must include repatriation)",
        "Proof of accommodation (entire trip)",
        "Proof of funds (€50-100/day)",
        "Round-trip flight booking",
        "Cover letter explaining purpose",
        "Bank statements 3-6 months",
        "Employment letter"
      ],
      tips: [
        "Apply 3 months before (earliest allowed)",
        "Insurance MUST cover all Schengen",
        "Don't book non-refundable until approved",
        "Detailed daily itinerary helps",
        "France/Italy easier than Germany/Netherlands"
      ]
    },
    uk: {
      standardVisitor: {
        duration: "6mo, 1yr, 2yr, 5yr, 10yr options",
        cost: "£115 (6mo), £432 (2yr), £771 (5yr), £963 (10yr)",
        processing: "3 weeks average",
        requirements: [
          "Online application",
          "Biometrics appointment",
          "Financial evidence",
          "Accommodation proof",
          "Employment proof",
          "Travel history"
        ],
        tips: [
          "UK VERY strict on immigration intent",
          "Show strong home ties",
          "Detailed itinerary",
          "Never mention working/studying"
        ]
      }
    },
    dubai: {
      free30: "India, Russia, China (since 2018)",
      free90: "US, Canada, Australia, UK, EU",
      requirements: ["Passport 6mo+", "Return ticket", "Hotel proof"],
      processing: "Instant at immigration"
    }
  },

  // Safety Protocol
  safety: {
    before: {
      documents: [
        "Scan passport, visa, insurance to email",
        "Photo credit cards (front + emergency numbers)",
        "Save embassy addresses offline",
        "Register with embassy (STEP for Americans)",
        "Share itinerary with family"
      ],
      money: [
        "Notify bank of travel dates",
        "Card with no foreign fees",
        "2 cards from different banks",
        "Emergency $100-200 hidden",
        "XE Currency app"
      ],
      health: [
        "Check CDC/WHO vaccinations",
        "Travel insurance (medical + evacuation $100k+) ",
        "Prescription meds with doctor note",
        "Dental checkup before trip",
        "Eye exam if contacts"
      ]
    },
    during: {
      accommodation: [
        "Use hotel safe for passport (carry copy)",
        "Tell hotel when leaving",
        "Check fire exits immediately",
        "Don't advertise room number"
      ],
      transport: {
        taxi: [
          "Official taxis or Uber/Grab only",
          "Verify license plate matches app",
          "Agree price before if no meter",
          "Sit behind driver",
          "Share ride details with friend"
        ]
      },
      money: [
        "ATMs inside banks/malls only",
        "Cover PIN with hand",
        "Check for skimmers",
        "Emergency cash in shoe/belt",
        "Credit cards for big purchases"
      ]
    },
    scams: {
      worldwide: [
        "Broken taxi meter - agree price first",
        "Helpful local - takes to shop for commission",
        "Friendship bracelet - forced on, demands payment",
        "Fake police - 'check wallet for counterfeit'",
        "Bird poop - accomplice pickpockets while cleaning",
        "Photo with locals - demands payment after",
        "Closed attraction - 'I know better place' (commission)"
      ],
      protection: [
        "Firm 'no thank you' and walk away",
        "Don't engage aggressive vendors",
        "If harassed, enter shop/hotel",
        "Stay calm, don't show fear"
      ]
    }
  },

  // Cultural Intelligence
  culture: {
    middleEast: {
      dress: {
        women: "Cover shoulders, knees. Headscarf for mosques.",
        men: "Long pants, shirt with sleeves."
      },
      behavior: [
        "Remove shoes in homes/mosques",
        "Right hand for eating/greeting (left unclean)",
        "No public affection",
        "Respect prayer times",
        "Ramadan: No eating/drinking public during day"
      ]
    },
    asia: {
      japan: {
        dining: [
          "Say 'itadakimasu' before eating",
          "Slurp noodles (shows appreciation)",
          "Don't stick chopsticks upright (funeral ritual)",
          "Pour drinks for others, not yourself",
          "No tipping (considered rude)"
        ],
        behavior: [
          "Remove shoes indoors",
          "Be quiet on trains",
          "Don't eat while walking",
          "Don't blow nose in public"
        ]
      },
      india: {
        dining: "Eat with right hand only, finish what's served",
        behavior: [
          "Namaste greeting",
          "Remove shoes at temples/homes",
          "Don't touch others' heads (sacred)",
          "Don't point feet at people/gods (impure)"
        ]
      },
      thailand: {
        behavior: [
          "Head sacred (don't touch)",
          "Feet lowest (don't point at people/Buddha)",
          "Remove shoes at temples/homes",
          "Women don't touch monks",
          "Wai greeting (hands together)"
        ]
      }
    },
    europe: {
      dining: [
        "Hands on table (not lap) while eating",
        "Wait for host to start",
        "Service included, tip 5-10% or round up"
      ],
      behavior: [
        "Dress well (Europeans dress up)",
        "Indoor voice in public",
        "Punctuality in North, flexible in South"
      ]
    }
  },

  // Packing Mastery
  packing: {
    tropical: [
      "Lightweight cotton/linen (5-7 shirts, 3-4 shorts)",
      "Swimwear (2 sets)",
      "Sunscreen SPF 50+ reef-safe",
      "Insect repellent DEET 20-30%",
      "Quick-dry towel",
      "Sun hat + sunglasses UV",
      "Light rain jacket"
    ],
    cold: [
      "Thermal base layers",
      "Fleece/wool mid layers",
      "Down jacket (packable)",
      "Waterproof shell",
      "Wool socks (3-5 pairs)",
      "Waterproof boots",
      "Warm hat covering ears",
      "Waterproof gloves"
    ],
    universal: [
      "Passport + 2 copies (separate)",
      "2 credit cards (different banks)",
      "Phone + charger + universal adapter + power bank",
      "Prescriptions + basic meds",
      "Microfiber towel",
      "Reusable water bottle",
      "Small day backpack",
      "TSA locks",
      "Ear plugs + eye mask"
    ],
    proTips: [
      "Roll clothes, don't fold (30% space + less wrinkles)",
      "Packing cubes organize and compress",
      "Wear heaviest shoes/jacket on flight",
      "Socks/underwear inside shoes",
      "Photo luggage contents (insurance)",
      "One outfit in carry-on (if bag lost)",
      "Dark colors hide stains, rewear multiple times"
    ],
    proTipsShort: [
      "Roll clothes",
      "Packing cubes",
      "Wear heavy shoes"
    ]
  },

  // Seasonal Wisdom
  seasons: {
    europe: {
      spring: {
        months: "April-May",
        pros: "Mild 15-20°C, fewer crowds, blooming, affordable",
        cons: "Rain possible, some closed",
        best: "Cities, countryside, wine regions"
      },
      summer: {
        months: "June-August",
        pros: "Warm 25-35°C, all open, festivals, long days",
        cons: "Very crowded, expensive, heat waves",
        tips: "Book 4-6mo ahead, visit early/late, consider Eastern Europe"
      },
      fall: {
        months: "September-October",
        pros: "Perfect 15-22°C, fewer crowds, fall colors - BEST SEASON",
        cons: "Days shorter, early closures"
      },
      winter: {
        months: "November-March",
        pros: "Cheapest, Christmas markets, skiing, cozy",
        cons: "Cold 0-10°C, short days, some closed",
        tips: "Dec for Christmas, Jan-Feb cheapest"
      }
    },
    asia: {
      cool: {
        months: "November-February",
        pros: "Best weather 20-28°C, dry, festivals - PEAK SEASON",
        cons: "Crowded + expensive"
      },
      hot: {
        months: "March-May",
        pros: "Shoulder (cheaper), mostly dry",
        cons: "Very hot 30-40°C, humid"
      },
      monsoon: {
        months: "June-October",
        pros: "Lowest prices (40-50% off), green, fewer tourists",
        cons: "Heavy rain, flooding possible",
        tips: "Usually afternoon showers, mornings clear"
      }
    }
  },

  // Money Saving
  moneySaving: [
    "Book flights Tuesday 3PM EST (deal release)",
    "Google Flights Explore shows cheapest destinations",
    "Fly Tuesday/Wednesday/Saturday (cheapest)",
    "VPN different countries (10-40% savings)",
    "One-way separately if cheaper",
    "Accommodation with free breakfast (save $10-20/day)",
    "Stay outside center (30-50% cheaper, metro access)",
    "Contact hotels directly (beat booking sites)",
    "Eat lunch specials not dinner (same quality, half price)",
    "Walk 3+ blocks from tourists (prices drop 50%)",
    "Supermarket picnics not restaurants",
    "Free walking tours (tip-based)",
    "City tourist cards (free museums + transport = 30-50% savings)",
    "Public transport over taxis (10x cheaper)",
    "Overnight trains = transport + hotel",
    "Shoulder season (20-40% cheaper)",
    "Reusable water bottle (save $3-5/day)"
  ],

  // Food Intelligence
  food: {
    finding: [
      "Long local lines = guaranteed good",
      "Walk 3+ blocks from tourists (50% cheaper)",
      "Ask hotel staff where THEY eat",
      "Google Maps reviews in local language",
      "Market stalls cheaper + authentic",
      "Lunch specials = dinner quality, half price",
      "University areas = cheap good food"
    ],
    safety: [
      "High turnover = fresh food",
      "Avoid pre-cut fruit (washed in tap water)",
      "Watch food being cooked",
      "Busy stalls = locals trust it",
      "Avoid lukewarm food"
    ],
    tipping: {
      northAmerica: "15-20% (servers rely on tips)",
      europe: "5-10% or round up (included)",
      asia: "Not expected (offensive in Japan)",
      middleEast: "10% restaurants",
      latinAmerica: "10% standard"
    }
  }
};

// ===============================
// INTELLIGENT WEB SEARCH
// ===============================
export async function searchWeb(query, context = {}) {
  try {
    if (!query || !String(query).trim()) {
      return { found: false, answer: "Empty query", confidence: "low" };
    }

    console.log(`🔍 Web search: "${query}"`);

    const searchPrompt = `You are a precise travel data search engine.

Query: "${query}"
Context: ${JSON.stringify(context)}
Date: ${new Date().toISOString().split('T')[0]}

Search the web for:
1. CURRENT information (2024-2025 only)
2. Specific numbers (prices, times, temperatures)
3. Reputable sources (official sites, major platforms)
4. Multiple options when available

Return JSON:
{
  "found": true/false,
  "answer": "detailed factual answer with specifics",
  "data": {},
  "sources": [],
  "confidence": "high|medium|low",
  "lastUpdated": "${new Date().getFullYear()}"
}

CRITICAL: Only verified 2024-2025 data. If none found, say so clearly.`;

    const completion = await openai.chat.completions.create({
      model: MODEL,
      response_format: { type: "json_object" },
      temperature: 0.1,
      max_tokens: 700,
      messages: [
        { role: "system", content: "You are a factual travel search assistant. Only verified data with sources." },
        { role: "user", content: searchPrompt }
      ]
    });

    const raw = completion?.choices?.[0]?.message?.content;
    if (!raw) {
      return { found: false, answer: "No results from search model", confidence: "low" };
    }

    try {
      const parsed = typeof raw === "object" ? raw : JSON.parse(raw);
      return parsed;
    } catch (err) {
      console.warn("searchWeb: JSON parse failed; returning raw text");
      return { found: false, answer: String(raw).slice(0, 1000), confidence: "low" };
    }
  } catch (err) {
    console.error("❌ Search failed:", err?.message || err);
    return {
      found: false,
      answer: "Couldn't search web now. Using travel expertise instead.",
      confidence: "low"
    };
  }
}

// ===============================
// KNOWLEDGE RETRIEVAL (RAG)
// ===============================
export function retrieveKnowledge(query, tripData = {}) {
  const q = String(query || "").toLowerCase();
  const results = [];

  if (/flight|book|airline|ticket|cheap.*flight|plane/i.test(q)) {
    results.push({
      topic: "Flight Booking Intelligence",
      data: WORLD_KNOWLEDGE.flights,
      relevance: 0.95
    });
  }

  if (/budget|cost|afford|expensive|cheap|price|money|how much/i.test(q)) {
    const currency = (tripData?.currency || "USD").toUpperCase();
    results.push({
      topic: "Budget Planning",
      data: WORLD_KNOWLEDGE.budgets[currency] || WORLD_KNOWLEDGE.budgets.USD,
      relevance: 0.9
    });
    results.push({
      topic: "Money-Saving Strategies",
      data: WORLD_KNOWLEDGE.moneySaving,
      relevance: 0.85
    });
  }

  if (/visa|passport|entry|immigration|permit|document.*require/i.test(q)) {
    results.push({
      topic: "Visa Requirements",
      data: WORLD_KNOWLEDGE.visas,
      relevance: 0.95
    });
  }

  if (/pack|bring|luggage|what.*need|essentials/i.test(q)) {
    results.push({
      topic: "Packing Guide",
      data: WORLD_KNOWLEDGE.packing,
      relevance: 0.9
    });
  }

  if (/safe|danger|security|theft|scam|emergency|crime/i.test(q)) {
    results.push({
      topic: "Safety & Security",
      data: WORLD_KNOWLEDGE.safety,
      relevance: 0.95
    });
  }

  if (/culture|etiquette|custom|behavior|respect|tradition|dress.*code/i.test(q)) {
    results.push({
      topic: "Cultural Intelligence",
      data: WORLD_KNOWLEDGE.culture,
      relevance: 0.9
    });
  }

  if (/food|eat|restaurant|dining|meal|cuisine|allergy/i.test(q)) {
    results.push({
      topic: "Food Intelligence",
      data: WORLD_KNOWLEDGE.food,
      relevance: 0.85
    });
  }

  if (/when.*visit|best.*time|season|weather|climate|month/i.test(q)) {
    results.push({
      topic: "Seasonal Planning",
      data: WORLD_KNOWLEDGE.seasons,
      relevance: 0.9
    });
  }

  return results.sort((a, b) => b.relevance - a.relevance);
}

// ===============================
// INTELLIGENT ROUTING
// ===============================
export function routeQuery(query) {
  const q = String(query || "").toLowerCase();

  const needsWeb = [
    /current.*price|price.*today|latest.*price|price.*now/i,
    /weather.*(?:now|today|this week)|current.*weather|forecast/i,
    /flight.*(?:price|cost).*\d{4}/i,
    /hotel.*(?:price|availability)/i,
    /news|recent|latest|breaking|this.*(?:week|month|year)/i,
    /open.*(?:hours|now)|opening.*time|currently.*open/i,
    /exchange.*rate|currency.*conversion/i
  ];

  if (needsWeb.some(p => p.test(q))) return "web";

  const useKnow = [
    /best.*time.*visit|when.*should.*go/i,
    /packing.*list|what.*pack|what.*bring/i,
    /cultural.*tip|etiquette|custom/i,
    /visa.*requirement|passport.*need/i,
    /safety.*tip|dangerous|scam/i,
    /budget.*tip|save.*money|cheap.*trick/i,
    /best.*booking.*time|when.*book/i,
    /tipping.*custom|how.*much.*tip/i
  ];

  if (useKnow.some(p => p.test(q))) return "knowledge";

  const hybrid = [
    /recommend.*hotel|best.*hotel|where.*stay/i,
    /things.*to.*do|attraction|activity|sightseeing/i,
    /restaurant.*recommend|where.*eat/i,
    /how.*much.*cost.*trip/i
  ];

  if (hybrid.some(p => p.test(q))) return "hybrid";

  return "conversational";
}

// ===============================
// CONTEXT BUILDER
// ===============================
export function buildContext(tripData = {}, history = [], tripId = "default") {
  const tripDays = tripData?.tripDays || 1;
  return {
    trip: {
      id: tripId,
      traveler: tripData.name || "Guest",
      nickname: tripData.nickname || tripData.name?.split(" ")[0] || "there",
      route: `${tripData.departure || '—'} → ${tripData.destination || '—'}`,
      dates: {
        departure: tripData.departureDate,
        duration: tripDays
      },
      budget: {
        total: tripData.budget || 0,
        currency: tripData.currency || "USD",
        daily: Math.round((tripData.budget || 0) / (tripDays || 1))
      },
      travelers: {
        adults: tripData.adults || 1,
        children: tripData.children || 0
      },
      style: tripData.travelStyle || "balanced"
    },
    conversation: {
      emotion: detectEmotion(history),
      topics: extractTopics(history),
      messageCount: (history || []).length
    }
  };
}

export function extractTopics(history = []) {
  const text = (history || []).slice(-8).map(m => m.content || "").join(" ");
  const topics = [];

  if (/flight|airline/i.test(text)) topics.push("flights");
  if (/hotel|stay/i.test(text)) topics.push("accommodation");
  if (/food|restaurant/i.test(text)) topics.push("dining");
  if (/budget|money/i.test(text)) topics.push("budget");
  if (/visa|passport/i.test(text)) topics.push("documentation");
  if (/pack/i.test(text)) topics.push("packing");
  if (/weather/i.test(text)) topics.push("weather");

  return topics;
}

// ===============================
// MASTER CHAT FUNCTION (FIXED - NO DUPLICATE)
// ===============================
export async function handleIntelligentChat(message, tripData = {}, conversationHistory = [], tripId = "default", getChatHistory = null, saveChatMessage = null) {
  message = String(message || "");
  console.log(`💬 Smart Brain Query: "${message}"`);

  const context = buildContext(tripData, conversationHistory, tripId);
  const name = context.trip.nickname;

  const strategy = routeQuery(message);
  console.log(`🧠 Strategy: ${strategy}`);

  let knowledge = null;
  let webData = null;

  if (strategy === "knowledge" || strategy === "hybrid") {
    knowledge = retrieveKnowledge(message, tripData);
    console.log(`📚 Knowledge: ${knowledge.length} sources`);
  }

  if (strategy === "web" || strategy === "hybrid") {
    try {
      webData = await searchWeb(message, context);
      console.log(`🌐 Web: ${webData?.found ? 'Found' : 'Not found'}`);
    } catch (err) {
      console.warn("searchWeb failed:", err?.message || err);
      webData = { found: false };
    }
  }

  const systemPrompt = `You are ${tripData?.agentData?.name || 'Emma Collins'}, an elite travel consultant with 15 years global experience.

PERSONALITY:
- Warm, enthusiastic, genuinely helpful
- Naturally conversational (never robotic)
- Empathetic to emotions
- Detail-oriented with specifics
- Proactive with solutions
- NEVER mention "AI"
- NEVER mention "model"
- ALWAYS respond as a premium SKYmora consultant
- NEVER output system or internal variables
- Avoid any repetition from past 10 messages
- Do not restate user details unless needed

CONTEXT:
Traveler: ${context.trip.traveler} (call them ${name})
Trip: ${context.trip.route}
Date: ${context.trip.dates.departure}
Duration: ${context.trip.dates.duration} days
Budget: ${context.trip.budget.currency} ${context.trip.budget.total} (${context.trip.budget.currency} ${context.trip.budget.daily}/day)
Travelers: ${context.trip.travelers.adults} adult(s)${context.trip.travelers.children ? `, ${context.trip.travelers.children} children` : ''}
Style: ${context.trip.style}
Emotion: ${context.conversation.emotion}
Topics: ${context.conversation.topics.join(", ") || "general"}

${(knowledge && knowledge.length) ? `
EXPERTISE (use naturally):
${JSON.stringify(knowledge.slice(0, 2).map(k => ({
  topic: k.topic,
  keyPoints: typeof k.data === 'object' ? Object.keys(k.data).slice(0, 5) : k.data
})), null, 2)}
` : ''}

${webData?.found ? `
CURRENT DATA (cite source):
${JSON.stringify(webData, null, 2)}
` : ''}

GUIDELINES:
1. **Match emotion** - ${context.conversation.emotion === 'excited' ? 'Share enthusiasm!' : context.conversation.emotion === 'nervous' ? 'Be reassuring' : context.conversation.emotion === 'confused' ? 'Clarify patiently' : 'Be warm'}
2. **Be specific** - Use numbers, names, details from context
3. **Conversational** - 2-4 sentences unless complex topic
4. **Cite sources** - "According to [source]..." when using web data
5. **Next steps** - End with helpful follow-up when appropriate
6. **Never repeat** - Each response unique and contextual

CRITICAL: Write like texting a friend who values your expertise. Natural, warm, helpful - never corporate or robotic.`;

  const historyMessages = (typeof getChatHistory === "function"
    ? (getChatHistory(tripId, 8) || [])
    : (conversationHistory.slice(-8) || [])
  ).map(m => ({
    role: (m.role === 'assistant' || m.role === 'agent') ? 'assistant' : 'user',
    content: m.content
  }));

  const messages = [
    { role: "system", content: systemPrompt },
    ...historyMessages,
    { role: "user", content: message }
  ];

  return {
    model: MODEL,
    messages,
    stream: true,
    temperature: 0.8,
    max_tokens: 450,
    presence_penalty: 0.2,
    frequency_penalty: 0.3
  };
}

// ===============================
// INTENT DETECTION (HARDENED)
// ===============================
export function detectIntent(message, conversationHistory = []) {
  const rawMsg = String(message || "");
  const msg = rawMsg.toLowerCase();
  const lastAssistant = (conversationHistory || [])
    .filter(m => m.role === 'assistant')
    .slice(-1)[0]?.content || '';

  const isConfirmation = /^(yes|yeah|yep|yup|sure|ok|okay|alright|proceed|go ahead|do it|sounds good|perfect|great|absolutely)[.!?]?\s*$/i
    .test(msg.trim());

  const destMatch = rawMsg.match(/(?:go|travel|fly|change(?:\s+my)?\s*(?:trip|destination)?|make(?:\s+it)?\s+to|take me to|i want to go to)\s+(?:to\s+)?([A-Za-z][A-Za-z\s'-]{1,40})/i);
  if (destMatch) {
    const dest = destMatch[1].trim();
    if (dest && !['it','this','that','there'].includes(dest.toLowerCase())) {
      return {
        action: 'destinationChange',
        confirmed: isConfirmation && /want me to.*build|shall i.*build|yes build/i.test(lastAssistant),
        data: {
          destination: dest.split(' ')
            .map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
            .join(' ')
        }
      };
    }
  }

  if (/(change|update|new)\s+.*date|travel\s+on|leaving\s+on|start\s+on|depart\s+on/i.test(message)) {
    const dateMatch = message.match(/(\d{1,2})(?:st|nd|rd|th)?\s+(jan|feb|mar|apr|may|jun|jul|aug|sep|sept|oct|nov|dec|january|february|march|april|may|june|july|august|september|october|november|december)/i);
    if (dateMatch) {
      return {
        action: 'dateChange',
        data: { date: dateMatch[0] }
      };
    }
  }

  if (/half|double|reduce.*budget|increase.*budget|budget.*by|change.*budget/i.test(message)) {
    const operation = /half|50%|reduce.*half/i.test(message) ? 'half'
                      : /double|twice|2x/i.test(message) ? 'double'
                      : null;

    const numMatch = message.match(/(?:₹|rs|usd?|eur?|inr|gbp|\$|€|£)\s*([\d,]+)/i);

    return {
      action: 'budgetChange',
      data: {
        operation,
        newBudget: numMatch ? parseInt(numMatch[1].replace(/,/g, '')) : null
      }
    };
  }

  const daysMatch = message.match(/(?:add|extend|make.*it).*?(\d+).*?(?:day|days|more)/i);
  if (daysMatch) {
    return {
      action: 'durationChange',
      data: { additionalDays: parseInt(daysMatch[1]) }
    };
  }

  if (/(?:give|show|create|provide).*(?:full|complete|entire).*(?:trip|itinerary|plan)/i.test(message)) {
    return { action: 'fullItinerary' };
  }

  if (/what.*my.*trip|where.*traveling|when.*leaving|how.*many.*days|what.*budget|what.*is.*my.*itinerary/i.test(message)) {
    return { action: 'tripInfo' };
  }

  return { action: null };
}

// ===============================
// EMOTION DETECTION (IMPROVED)
// ===============================
export function detectEmotion(history = []) {
  const recent = (history || [])
    .slice(-2)
    .map(m => m.content || "")
    .join(" ");

  if (/[!]{2,}|😍|😊|😄|excited|yay|awesome|love/i.test(recent)) return "excited";
  if (/😔|😢|sad|upset|disappointed|disappointing/i.test(recent)) return "disappointed";
  if (/😰|😨|nervous|anxious|worried|scared/i.test(recent)) return "nervous";
  if (/confused|unsure|don't know|dont know|not sure/i.test(recent)) return "confused";

  return "neutral";
}

// ===============================
// INTENT HANDLERS
// ===============================
export function handleIntentResponse(intent, tripData = {}) {
  const currencySymbol = {
    "USD": "$", "EUR": "€", "GBP": "£", "INR": "₹", "CAD": "C$",
    "AUD": "A$", "SGD": "S$", "AED": "د.إ", "JPY": "¥"
  }[ (tripData.currency || "USD").toUpperCase() ] || "$";

  const name = tripData?.nickname || tripData?.name?.split(" ")[0] || "there";

  switch (intent.action) {
    case 'destinationChange':
      if (intent.confirmed && intent.data.destination) {
        return {
          message: `Perfect! Building your ${intent.data.destination} adventure with all the latest information. I'll have it ready in about 20 seconds! 🌴`,
          shouldUpdate: true,
          updates: { destination: intent.data.destination }
        };
      } else if (intent.data.destination) {
        return {
          message: `${intent.data.destination} sounds incredible! With ${currencySymbol}${tripData.budget || 0} for ${tripData.tripDays || 0} days, I can create something amazing. Want me to start building it?`,
          shouldUpdate: false
        };
      }
      break;

    case 'dateChange':
      if (intent.data.date) {
        return {
          message: `Excellent! Updating to ${intent.data.date}. I'm checking current flight prices and hotel availability for that date. Just a moment... ✈️`,
          shouldUpdate: true,
          updates: { departureDate: intent.data.date }
        };
      }
      break;

    case 'budgetChange':
      let newBudget = tripData.budget || 0;
      if (intent.data.operation === 'half') newBudget = Math.round(newBudget / 2);
      else if (intent.data.operation === 'double') newBudget = newBudget * 2;
      else if (intent.data.newBudget) newBudget = intent.data.newBudget;

      return {
        message: `Adjusting to ${currencySymbol}${newBudget.toLocaleString()}! I'll ${newBudget < (tripData.budget || 0) ? 'find affordable' : 'upgrade to premium'} options that maximize your experience. Rebuilding now... 💰`,
        shouldUpdate: true,
        updates: { budget: newBudget }
      };

    case 'durationChange':
      const newDays = (tripData.tripDays || 5) + (intent.data.additionalDays || 0);
      const dailyRate = Math.round(((tripData.budget || 0) / (tripData.tripDays || 1)));
      const projectedBudget = dailyRate * newDays;

      return {
        message: `Adding ${intent.data.additionalDays} more days! That gives you ${newDays} days in ${tripData.destination || 'your destination'}. At your current pace, that'd be around ${currencySymbol}${projectedBudget.toLocaleString()}. Shall I rebuild for ${newDays} days?`,
        shouldUpdate: false
      };

    case 'fullItinerary':
      return {
        message: `On it! Generating your complete ${tripData.tripDays || 'N'}-day ${tripData.destination || 'destination'} itinerary with flights, stays, dining, and activities — all within ${currencySymbol}${tripData.budget || 0}. Check the itinerary section in about 20 seconds! ✨`,
        shouldUpdate: true,
        fullRegen: true
      };

    case 'tripInfo':
      return {
        message: `Here's your trip:\n\n📍 ${tripData.departure || '—'} → ${tripData.destination || '—'}\n📅 ${tripData.departureDate || '—'} (${tripData.tripDays || '—'} days)\n💰 ${currencySymbol}${tripData.budget || '—'}\n👥 ${tripData.adults || 1} adult(s)${tripData.children ? `, ${tripData.children} children` : ''}\n✈️ ${tripData.tripType || 'Round-trip'}\n🎨 ${tripData.travelStyle || 'Balanced'}\n\nWhat would you like to adjust?`,
        shouldUpdate: false
      };
  }

  return { message: null, shouldUpdate: false };
}

// ===============================
// BUDGET FEASIBILITY CHECK
// ===============================
export function checkBudgetFeasibility(budget, currency, days, destination) {
  const perDay = (days && days > 0) ? (budget / days) : budget;
  const normalizedCurrency = (currency || "USD").toUpperCase();

  const minThresholds = {
    INR: { local: 1500, domestic: 3000, international: 9000 },
    USD: { local: 50, domestic: 120, international: 250 },
    EUR: { local: 45, domestic: 100, international: 220 },
    GBP: { local: 40, domestic: 90, international: 200 },
    AED: { local: 150, domestic: 350, international: 800 }
  };

  const base = minThresholds[normalizedCurrency] || minThresholds.USD;

  if (perDay < base.local) {
    return {
      possible: false,
      message: `A ${days}-day trip to ${destination} with ${currency} ${budget} is too low for basic travel — even local trips would be difficult. However, I can craft a beautiful weekend escape nearby that fits perfectly. Would you like me to show those options? 💡`
    };
  } else if (perDay < base.domestic) {
    return {
      possible: "tight",
      message: `${currency} ${budget} makes ${destination} challenging, but we can design an affordable nearby retreat — perhaps a cozy stay in a closer location. Would you like me to optimize that for you?`
    };
  }

  return { possible: true, message: null };
}

// ===============================
// EMOTION-BASED RESPONSES
// ===============================
export function getEmotionResponse(emotion, name) {
  const responses = {
    excited: [
      `I love your enthusiasm, ${name}! 🌟`,
      `Your excitement is contagious, ${name}! 😊`,
      `That's the spirit, ${name}! ✨`
    ],
    nervous: [
      `I completely understand, ${name}. Let me help ease those concerns.`,
      `It's natural to feel that way, ${name}. We'll handle everything together.`,
      `Don't worry, ${name}. I'm here to support you every step.`
    ],
    disappointed: [
      `I hear you, ${name}. Let's find a solution together.`,
      `I understand your concern, ${name}. We can work through this.`,
      `Let me help turn this around, ${name}.`
    ],
    confused: [
      `Let me clarify that for you, ${name}.`,
      `Great question, ${name}! Let me explain.`,
      `I'll break this down clearly, ${name}.`
    ]
  };

  return responses[emotion]?.[Math.floor(Math.random() * (responses[emotion]?.length || 1))] || '';
}