// ===============================
// SKYmora Travel Firewall (FIXED - LESS AGGRESSIVE)
// Allows natural conversation while blocking only real threats
// ===============================

// Word-boundary safe travel patterns
const travelPatterns = {
  weather: /\b(weather|temperature|temp|climate|forecast|cold|hot|rain)\b/i,
  location: /\b(where am i|my location|current city|which country|where\s+(am i|i am))\b/i,
  tripInfo: /\b(my trip|where\s+am\s+going|where\s+going|when\s+leaving|how many days|budget|itinerary|departure|return\s*date|trip\s*days)\b/i,
  destination: /\b(go to|travel to|visit|plan.*trip|recommend.*destination|suggest.*destination)\b/i,
  booking: /\b(book|flight|hotel|accommodation|price|cost|how much|reserve|booking|tickets?)\b/i,
  visa: /\b(visa|passport|entry\s*requirement|immigration|visa\s*require)\b/i,
  packing: /\b(pack|bring|luggage|packing list|what\s+to\s+pack|what\s+should\s+i\s+pack)\b/i,
  safety: /\b(safe|danger|scam|theft|emergency|safety|secure)\b/i,
  cultural: /\b(culture|etiquette|custom|tradition|dress code)\b/i,
  food: /\b(food|restaurant|eat|dining|cuisine|meal)\b/i,
  budget: /\b(budget|afford|expensive|cheap|save\s*money|how much\s*cost)\b/i,
  time: /\b(time\s+in|what\s+time|current time|today|tomorrow)\b/i,
  activities: /\b(things to do|activities|attractions|tour|sightseeing)\b/i
};

// Strict forbidden pattern (only truly dangerous content)
const forbiddenPattern = /\b(sex|porn|explicit|nude|suicide|kill yourself|bomb|terror|attack|explosive|weapon|cocaine|heroin|meth)\b/i;

// Very strict inappropriate pattern (only clear romantic advances)
const inappropriatePattern = /\b(date me|marry me|kiss me|i love you romantically|be my girlfriend|be my boyfriend|sleep with me)\b/i;

// ===== RESPONSE TEMPLATES ===== //
const RESPONSES = {
  softDecline: (name = "friend") =>
    `I appreciate that, ${name}! I'm your dedicated travel consultant — let's focus on planning an amazing trip. What would you like to work on? 🌍`,

  forbidden:
    `I can't help with that. If you need travel assistance, I'm right here to help with flights, hotels, visas and more.`,
};

// ===============================
// MAIN FIREWALL FUNCTION (FIXED - ALLOWS CONVERSATION)
// ===============================

export function classifyMessage(message = "", tripData = {}) {
  let text = (message || "").trim();
  if (!text) return { action: "allow" }; // ✅ Changed from "invalid" to "allow"

  // Normalize
  text = text.replace(/\s+/g, " ").trim();

  const rawName =
    tripData?.nickname ||
    (typeof tripData?.name === "string"
      ? tripData.name.split(" ")[0]
      : null) ||
    "there";

  const safeName = rawName.replace(/[^\p{L}]/gu, "") || "there";

  // ========= FORBIDDEN FIRST (VERY STRICT) ========= //
  if (forbiddenPattern.test(text)) {
    return { action: "forbidden", reason: "forbidden content" };
  }

  // ========= INAPPROPRIATE (VERY STRICT) ========= //
  if (inappropriatePattern.test(text)) {
    return {
      action: "inappropriate",
      confidence: 0.95,
      reply: RESPONSES.softDecline(safeName)
    };
  }

  // ========= TRAVEL PATTERNS (EXPLICIT ALLOW) ========= //
  for (const [subCategory, pattern] of Object.entries(travelPatterns)) {
    if (pattern.test(text)) {
      return {
        action: "allow",
        category: "travel",
        subCategory
      };
    }
  }

  // ========= CASUAL CONVERSATION (ALLOW BY DEFAULT) ========= //
  // This is the KEY FIX - we allow normal conversation
  const casualPatterns = [
    /^(hi|hello|hey|yo|sup|what'?s up|how are you|how r u|whats up)/i,
    /\b(thank|thanks|great|awesome|nice|cool|good|excellent|perfect)\b/i,
    /\b(yes|no|ok|okay|sure|fine|alright|nope|yep|yeah)\b/i,
    /\b(happy|excited|nervous|worried|scared|anxious|confused)\b/i,
    /\b(feel|feeling|emotion|mood)\b/i,
    /\b(age|old|young|year)\b/i, // Allow age questions
    /\b(you|your|yourself)\b/i, // Allow questions about assistant
    /\b(tell me|show me|explain|describe)\b/i,
    /\b(can i|should i|would i|could i)\b/i,
    /\b(what|where|when|why|how|who)\b/i
  ];

  // If it matches casual conversation, ALLOW
  if (casualPatterns.some(pattern => pattern.test(text))) {
    return {
      action: "allow",
      category: "conversation",
      subCategory: "casual"
    };
  }

  // ========= DEFAULT: ALLOW (CHANGED FROM REDIRECT) ========= //
  // This is the most important fix - we allow by default
  return {
    action: "allow",
    category: "general",
    confidence: 0.8
  };
}

export default classifyMessage;