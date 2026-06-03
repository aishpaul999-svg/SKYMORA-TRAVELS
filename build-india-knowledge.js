/**
 * SKYmora India Knowledge Base Builder
 * Generates all Indian city files with the 16-section Indian architecture
 * Run: node build-india-knowledge.js [cityname] OR node build-india-knowledge.js all
 */

import 'dotenv/config';
import OpenAI from 'openai';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const DEST_DIR = path.join(__dirname, 'data', 'destinations');

// ── Complete India city list ──
const INDIA_CITIES = [
  // Rajasthan
  { city: 'Jaipur', state: 'Rajasthan', type: 'city', nearestAirport: 'JAI', nearestRailway: 'Jaipur Junction', nearestMajorCity: 'Delhi (280km)' },
  { city: 'Jodhpur', state: 'Rajasthan', type: 'city', nearestAirport: 'JDH', nearestRailway: 'Jodhpur Junction', nearestMajorCity: 'Jaipur (340km)' },
  { city: 'Udaipur', state: 'Rajasthan', type: 'city', nearestAirport: 'UDR', nearestRailway: 'Udaipur City', nearestMajorCity: 'Jaipur (395km)' },
  { city: 'Jaisalmer', state: 'Rajasthan', type: 'city', nearestAirport: 'JSA', nearestRailway: 'Jaisalmer', nearestMajorCity: 'Jodhpur (295km)' },
  { city: 'Pushkar', state: 'Rajasthan', type: 'town', nearestAirport: 'JAI (150km)', nearestRailway: 'Ajmer (11km)', nearestMajorCity: 'Jaipur (145km)' },
  { city: 'Ranthambore', state: 'Rajasthan', type: 'wildlife', nearestAirport: 'JAI (180km)', nearestRailway: 'Sawai Madhopur (11km)', nearestMajorCity: 'Jaipur (180km)' },
  { city: 'Mount Abu', state: 'Rajasthan', type: 'hill station', nearestAirport: 'UDR (185km)', nearestRailway: 'Abu Road (27km)', nearestMajorCity: 'Udaipur (185km)' },
  { city: 'Bikaner', state: 'Rajasthan', type: 'city', nearestAirport: 'BKB', nearestRailway: 'Bikaner Junction', nearestMajorCity: 'Jaipur (330km)' },
  { city: 'Kumbhalgarh', state: 'Rajasthan', type: 'heritage', nearestAirport: 'UDR (84km)', nearestRailway: 'Falna (82km)', nearestMajorCity: 'Udaipur (84km)' },
  { city: 'Chittorgarh', state: 'Rajasthan', type: 'heritage', nearestAirport: 'UDR (115km)', nearestRailway: 'Chittorgarh', nearestMajorCity: 'Udaipur (115km)' },
  // Uttarakhand
  { city: 'Rishikesh', state: 'Uttarakhand', type: 'spiritual/adventure', nearestAirport: 'DED (35km)', nearestRailway: 'Haridwar (25km)', nearestMajorCity: 'Delhi (240km)' },
  { city: 'Haridwar', state: 'Uttarakhand', type: 'spiritual', nearestAirport: 'DED (55km)', nearestRailway: 'Haridwar Junction', nearestMajorCity: 'Delhi (215km)' },
  { city: 'Mussoorie', state: 'Uttarakhand', type: 'hill station', nearestAirport: 'DED (54km)', nearestRailway: 'Dehradun (35km)', nearestMajorCity: 'Delhi (290km)' },
  { city: 'Nainital', state: 'Uttarakhand', type: 'hill station', nearestAirport: 'PGH (70km)', nearestRailway: 'Kathgodam (34km)', nearestMajorCity: 'Delhi (310km)' },
  { city: 'Jim Corbett', state: 'Uttarakhand', type: 'wildlife', nearestAirport: 'PGH (105km)', nearestRailway: 'Ramnagar (14km)', nearestMajorCity: 'Delhi (245km)' },
  { city: 'Auli', state: 'Uttarakhand', type: 'ski/adventure', nearestAirport: 'DED (250km)', nearestRailway: 'Haridwar (273km)', nearestMajorCity: 'Delhi (500km)' },
  { city: 'Kedarnath', state: 'Uttarakhand', type: 'pilgrimage', nearestAirport: 'DED (240km)', nearestRailway: 'Haridwar (253km)', nearestMajorCity: 'Delhi (462km)' },
  { city: 'Valley of Flowers', state: 'Uttarakhand', type: 'trek/nature', nearestAirport: 'DED (300km)', nearestRailway: 'Haridwar (310km)', nearestMajorCity: 'Delhi (520km)' },
  // Himachal Pradesh
  { city: 'Manali', state: 'Himachal Pradesh', type: 'hill station/adventure', nearestAirport: 'KUU (50km)', nearestRailway: 'Joginder Nagar (165km)', nearestMajorCity: 'Delhi (540km)' },
  { city: 'Shimla', state: 'Himachal Pradesh', type: 'hill station', nearestAirport: 'SLV (23km)', nearestRailway: 'Kalka (96km)', nearestMajorCity: 'Delhi (350km)' },
  { city: 'Dharamshala', state: 'Himachal Pradesh', type: 'spiritual/culture', nearestAirport: 'DHM (15km)', nearestRailway: 'Pathankot (90km)', nearestMajorCity: 'Delhi (480km)' },
  { city: 'Spiti Valley', state: 'Himachal Pradesh', type: 'remote/adventure', nearestAirport: 'KUU (230km)', nearestRailway: 'Shimla (412km)', nearestMajorCity: 'Delhi (750km)' },
  { city: 'Kasol', state: 'Himachal Pradesh', type: 'backpacker', nearestAirport: 'KUU (75km)', nearestRailway: 'Joginder Nagar (130km)', nearestMajorCity: 'Delhi (515km)' },
  // Kerala
  { city: 'Kochi', state: 'Kerala', type: 'city/heritage', nearestAirport: 'COK', nearestRailway: 'Ernakulam Junction', nearestMajorCity: 'Bangalore (550km)' },
  { city: 'Munnar', state: 'Kerala', type: 'hill station', nearestAirport: 'COK (110km)', nearestRailway: 'Ernakulam (130km)', nearestMajorCity: 'Kochi (110km)' },
  { city: 'Alleppey', state: 'Kerala', type: 'backwaters', nearestAirport: 'COK (85km)', nearestRailway: 'Alleppey', nearestMajorCity: 'Kochi (85km)' },
  { city: 'Thekkady', state: 'Kerala', type: 'wildlife/spice', nearestAirport: 'COK (165km)', nearestRailway: 'Ernakulam (190km)', nearestMajorCity: 'Kochi (165km)' },
  { city: 'Varkala', state: 'Kerala', type: 'beach/cliff', nearestAirport: 'TRV (53km)', nearestRailway: 'Varkala Sivagiri', nearestMajorCity: 'Thiruvananthapuram (53km)' },
  { city: 'Wayanad', state: 'Kerala', type: 'nature/tribal', nearestAirport: 'CCJ (100km)', nearestRailway: 'Kozhikode (95km)', nearestMajorCity: 'Calicut (95km)' },
  // Karnataka
  { city: 'Bangalore', state: 'Karnataka', type: 'city/tech hub', nearestAirport: 'BLR', nearestRailway: 'KSR Bengaluru', nearestMajorCity: 'Chennai (350km)' },
  { city: 'Mysore', state: 'Karnataka', type: 'heritage/culture', nearestAirport: 'MYQ', nearestRailway: 'Mysuru Junction', nearestMajorCity: 'Bangalore (145km)' },
  { city: 'Coorg', state: 'Karnataka', type: 'hill station/coffee', nearestAirport: 'MYQ (120km)', nearestRailway: 'Mysuru (118km)', nearestMajorCity: 'Bangalore (265km)' },
  { city: 'Hampi', state: 'Karnataka', type: 'ruins/heritage', nearestAirport: 'HBX (80km)', nearestRailway: 'Hosapete (13km)', nearestMajorCity: 'Bangalore (340km)' },
  { city: 'Gokarna', state: 'Karnataka', type: 'beach/spiritual', nearestAirport: 'IXG (59km)', nearestRailway: 'Gokarna Road', nearestMajorCity: 'Goa (140km)' },
  // Maharashtra
  { city: 'Mumbai', state: 'Maharashtra', type: 'megacity', nearestAirport: 'BOM', nearestRailway: 'CSMT/Mumbai Central', nearestMajorCity: 'Pune (150km)' },
  { city: 'Pune', state: 'Maharashtra', type: 'city/culture', nearestAirport: 'PNQ', nearestRailway: 'Pune Junction', nearestMajorCity: 'Mumbai (150km)' },
  { city: 'Lonavala', state: 'Maharashtra', type: 'hill station', nearestAirport: 'PNQ (65km)', nearestRailway: 'Lonavala', nearestMajorCity: 'Mumbai (96km)' },
  { city: 'Mahabaleshwar', state: 'Maharashtra', type: 'hill station', nearestAirport: 'PNQ (120km)', nearestRailway: 'Wathar (60km)', nearestMajorCity: 'Pune (120km)' },
  // Goa (already exists — skip)
  // Tamil Nadu
  { city: 'Chennai', state: 'Tamil Nadu', type: 'megacity', nearestAirport: 'MAA', nearestRailway: 'Chennai Central', nearestMajorCity: 'Bangalore (350km)' },
  { city: 'Madurai', state: 'Tamil Nadu', type: 'temple city', nearestAirport: 'IXM', nearestRailway: 'Madurai Junction', nearestMajorCity: 'Chennai (460km)' },
  { city: 'Ooty', state: 'Tamil Nadu', type: 'hill station', nearestAirport: 'CJB (105km)', nearestRailway: 'Mettupalayam (40km)', nearestMajorCity: 'Coimbatore (88km)' },
  { city: 'Pondicherry', state: 'Tamil Nadu', type: 'French heritage/beach', nearestAirport: 'MAA (170km)', nearestRailway: 'Villupuram (35km)', nearestMajorCity: 'Chennai (170km)' },
  { city: 'Mahabalipuram', state: 'Tamil Nadu', type: 'UNESCO/beach', nearestAirport: 'MAA (58km)', nearestRailway: 'Chennai Beach (58km)', nearestMajorCity: 'Chennai (58km)' },
  // Uttar Pradesh
  { city: 'Varanasi', state: 'Uttar Pradesh', type: 'spiritual/ancient', nearestAirport: 'VNS', nearestRailway: 'Varanasi Junction', nearestMajorCity: 'Prayagraj (120km)' },
  { city: 'Agra', state: 'Uttar Pradesh', type: 'heritage/Taj', nearestAirport: 'AGR', nearestRailway: 'Agra Cantt', nearestMajorCity: 'Delhi (206km)' },
  { city: 'Lucknow', state: 'Uttar Pradesh', type: 'city/cuisine', nearestAirport: 'LKO', nearestRailway: 'Lucknow Charbagh', nearestMajorCity: 'Varanasi (295km)' },
  { city: 'Prayagraj', state: 'Uttar Pradesh', type: 'spiritual/Kumbh', nearestAirport: 'IXD', nearestRailway: 'Prayagraj Junction', nearestMajorCity: 'Varanasi (120km)' },
  // Delhi
  { city: 'Delhi', state: 'Delhi', type: 'capital/megacity', nearestAirport: 'DEL', nearestRailway: 'New Delhi/Hazrat Nizamuddin', nearestMajorCity: 'Agra (206km)' },
  // Ladakh / J&K
  { city: 'Leh', state: 'Ladakh', type: 'high altitude/Buddhist', nearestAirport: 'IXL', nearestRailway: 'None (nearest Jammu 700km)', nearestMajorCity: 'Manali (480km)' },
  { city: 'Pangong Lake', state: 'Ladakh', type: 'lake/scenic', nearestAirport: 'IXL (160km)', nearestRailway: 'None', nearestMajorCity: 'Leh (160km)' },
  { city: 'Srinagar', state: 'Jammu & Kashmir', type: 'houseboat/gardens', nearestAirport: 'SXR', nearestRailway: 'Banihal (110km)', nearestMajorCity: 'Delhi (900km by road)' },
  { city: 'Gulmarg', state: 'Jammu & Kashmir', type: 'ski/meadow', nearestAirport: 'SXR (56km)', nearestRailway: 'Banihal (150km)', nearestMajorCity: 'Srinagar (56km)' },
  // West Bengal & Northeast
  { city: 'Kolkata', state: 'West Bengal', type: 'megacity/culture', nearestAirport: 'CCU', nearestRailway: 'Howrah/Sealdah', nearestMajorCity: 'Bhubaneswar (440km)' },
  { city: 'Darjeeling', state: 'West Bengal', type: 'tea/mountain views', nearestAirport: 'IXB (67km)', nearestRailway: 'New Jalpaiguri (88km)', nearestMajorCity: 'Kolkata (600km)' },
  { city: 'Gangtok', state: 'Sikkim', type: 'mountain/Buddhist', nearestAirport: 'PYG (30km)', nearestRailway: 'New Jalpaiguri (125km)', nearestMajorCity: 'Darjeeling (100km)' },
  { city: 'Shillong', state: 'Meghalaya', type: 'hill station/waterfalls', nearestAirport: 'SHL (30km)', nearestRailway: 'Guwahati (103km)', nearestMajorCity: 'Guwahati (100km)' },
  { city: 'Kaziranga', state: 'Assam', type: 'wildlife/UNESCO', nearestAirport: 'JRH (97km)', nearestRailway: 'Furkating (75km)', nearestMajorCity: 'Guwahati (217km)' },
  // Andaman
  { city: 'Havelock Island', state: 'Andaman & Nicobar', type: 'beach/dive', nearestAirport: 'IXZ (Port Blair 55km by ferry)', nearestRailway: 'None', nearestMajorCity: 'Port Blair (55km by sea)' },
  // Odisha
  { city: 'Puri', state: 'Odisha', type: 'temple/beach', nearestAirport: 'BBI (62km)', nearestRailway: 'Puri', nearestMajorCity: 'Bhubaneswar (62km)' },
  // Gujarat
  { city: 'Ahmedabad', state: 'Gujarat', type: 'heritage/business', nearestAirport: 'AMD', nearestRailway: 'Ahmedabad Junction', nearestMajorCity: 'Mumbai (530km)' },
  { city: 'Rann of Kutch', state: 'Gujarat', type: 'salt desert/festival', nearestAirport: 'BHJ (80km)', nearestRailway: 'Bhuj (80km)', nearestMajorCity: 'Ahmedabad (380km)' },
  // Punjab
  { city: 'Amritsar', state: 'Punjab', type: 'spiritual/Golden Temple', nearestAirport: 'ATQ', nearestRailway: 'Amritsar Junction', nearestMajorCity: 'Delhi (450km)' },
  // Madhya Pradesh
  { city: 'Khajuraho', state: 'Madhya Pradesh', type: 'UNESCO/temples', nearestAirport: 'HJR', nearestRailway: 'Khajuraho', nearestMajorCity: 'Delhi (620km)' },
  { city: 'Orchha', state: 'Madhya Pradesh', type: 'heritage/forts', nearestAirport: 'GWL (120km)', nearestRailway: 'Jhansi (16km)', nearestMajorCity: 'Delhi (450km)' },
];

// ── Indian city knowledge builder prompt ──
function buildIndianCityPrompt(cityData) {
  const { city, state, type, nearestAirport, nearestRailway, nearestMajorCity } = cityData;

  // Real train reference data to prevent GPT from making up wrong trains
  const trainData = {
    'Rishikesh': 'Delhi→Haridwar: Shatabdi 12017 (6:45am, 4.5h, ₹695 CC) then shared jeep to Rishikesh ₹80',
    'Haridwar': 'Delhi→Haridwar: Shatabdi 12017 (6:45am, 4.5h, ₹695 CC) or Jan Shatabdi 12055 (3h 45min, ₹350 CC)',
    'Mussoorie': 'Delhi→Dehradun: Shatabdi 12017 (6:45am, 5.5h, ₹755 CC) then taxi/shared cab to Mussoorie (30km)',
    'Nainital': 'Delhi→Kathgodam: Ranikhet Express 15013 (overnight, 8h, ₹250 sleeper) then shared taxi/bus 35km',
    'Jim Corbett': 'Delhi→Ramnagar: Express trains, 7-8h, ₹200-350 sleeper',
    'Manali': 'Delhi→Manali: No direct train. Volvo/HRTC bus from ISBT Kashmiri Gate (12-14h, ₹800-1500). Flight to Kullu (KUU) Air India ₹4,000-8,000',
    'Shimla': 'Delhi→Kalka: Kalka Mail 12011 (departs 7:40am, 5h, ₹495 CC) then toy train to Shimla (5h, ₹335)',
    'Dharamshala': 'Delhi→Pathankot: Express trains (8-9h, ₹300-500 sleeper) then bus/taxi 90km to Dharamshala',
    'Spiti Valley': 'Delhi→Shimla: See Shimla route. Then bus to Spiti (12-16h, ₹600). Or Delhi→Manali then Spiti by road (8-10h)',
    'Kasol': 'Delhi→Bhuntar: Volvo bus to Kullu/Manali ₹800-1200, get off at Bhuntar (12h) then taxi/local bus 20km',
    'Varanasi': 'Delhi→Varanasi: Vande Bharat Express 22436 (departs 6:00am, 8h, ₹1,755 CC) or Rajdhani 12382 (overnight, ₹1,000 3AC)',
    'Agra': 'Delhi→Agra: Shatabdi 12002 (departs 6:00am, 2h, ₹885 CC) or Gatimaan Express 12050 (1h 40min, ₹755)',
    'Lucknow': 'Delhi→Lucknow: Shatabdi 12004 (departs 6:10am, 6.5h, ₹1,100 CC) or Lucknow Mail 12230 (overnight)',
    'Jaipur': 'Delhi→Jaipur: Shatabdi 12015 (departs 6:10am, 4.5h, ₹855 CC) or Double Decker Express 12985 (4h 50min)',
    'Jodhpur': 'Delhi→Jodhpur: Mandore Express 12461 (overnight, 10h, ₹350 sleeper) or Intercity 12461',
    'Udaipur': 'Delhi→Udaipur: Chetak Express 12963 (overnight, 13h, ₹400 sleeper) or Mewar Express 12963',
    'Jaisalmer': 'Delhi→Jaisalmer: Jaisalmer Express 14059 (overnight, 17h, ₹500 sleeper)',
    'Pushkar': 'Delhi→Ajmer: Shatabdi 12015 or express trains (5-6h, ₹700-900 CC) then bus/auto 11km to Pushkar',
    'Kochi': 'Delhi→Kochi: Flight (DEL→COK, 3.5h, ₹4,000-8,000). Train possible but 40+ hours.',
    'Alleppey': 'Kochi→Alleppey: State bus ₹62 (1.5h) or private bus. KSRTC recommended.',
    'Munnar': 'Kochi→Munnar: Private bus/taxi (3-3.5h, ₹150-200 bus)',
    'Goa': 'Delhi→Goa: Rajdhani 12431 (overnight, 24h, ₹1,500 3AC) or flight (DEL→GOI, 2.5h, ₹4,000-7,000)',
    'Mumbai': 'Delhi→Mumbai: Rajdhani 12952 (16h, ₹2,100 3AC) or flight (DEL→BOM, 2h, ₹3,500-7,000)',
    'Bangalore': 'Delhi→Bangalore: Flight best option (DEL→BLR, 2.5h, ₹4,000-8,000). Train 30+ hours.',
    'Delhi': 'Delhi is the hub — all trains originate from New Delhi, Hazrat Nizamuddin, or Old Delhi stations',
    'Amritsar': 'Delhi→Amritsar: Shatabdi 12013 (departs 7:20am, 6h, ₹1,255 CC) or Golden Temple Mail 11077 (overnight, ₹350 sleeper)',
    'Darjeeling': 'Delhi→NJP: Rajdhani 12436 (overnight, 16h, ₹1,400 3AC) then shared jeep to Darjeeling (3-4h, ₹200)',
    'Kolkata': 'Delhi→Kolkata: Rajdhani 12302 (17h, ₹2,100 3AC) or flight (DEL→CCU, 2.5h, ₹4,000-7,000)',
  };
  const trainRef = trainData[city] || `Check IRCTC.co.in for trains from Delhi to nearest station (${nearestRailway})`;

  return `You are a world-class Indian travel expert and content writer for SKYmora Travels.

Create a COMPREHENSIVE JSON knowledge file for ${city}, ${state} (${type}).

CRITICAL CONTEXT:
- Primary audience: Indian domestic travelers (Delhi, Mumbai, Bangalore, Chennai, Pune)
- Secondary: International tourists visiting India
- Budget reality: Many Indian travelers budget ₹2,000-6,000/day, not ₹20,000+
- Key concern: How do I get there cheaply and safely from major Indian cities?
- Transport hub: Nearest airport: ${nearestAirport} | Railway: ${nearestRailway} | Nearest major city: ${nearestMajorCity}

Return ONLY valid JSON with this EXACT structure (all fields required):

{
  "destination": "${city}",
  "state": "${state}",
  "type": "${type}",
  "aliases": ["${city}", "${city.toLowerCase()}", "${state}"],
  "lastUpdated": "2026-06",
  "_schemaVersion": "4.0-india",

  "meta": {
    "dataQualityScore": 9.2,
    "bestFor": ["list 5 traveler types who would love this"],
    "notFor": ["list 3 traveler types who would be disappointed"]
  },

  "whyPeopleFallInLove": "2-3 sentences. Specific. NOT 'beautiful city'. Example: People arrive for the temples. They stay for the ghats. They return because ${city} is the only city in India where the ancient and the modern haven't been reconciled — they simply coexist.",

  "honestTruth": "ONE sentence that makes SKYmora sound like a specialist who truly knows this place. The thing most guides miss. Specific and honest.",

  "localTruths": [
    "Most visitors think [X about ${city}]. Locals think [Y — the real truth].",
    "Most visitors [do Z]. The best version of ${city} is [the local alternative].",
    "Most visitors spend [too much time at A]. The real [city] starts at [B]."
  ],

  "neighborhoodPersonalities": {
    "[neighbourhood name]": { "tags": ["tag1", "tag2", "tag3"], "bestFor": "one sentence", "avoid": "one honest caveat" }
  },

  "firstVsRepeatVisit": {
    "first": {
      "mustDo": ["3-4 specific things"],
      "avoid": ["2 common first-timer mistakes"],
      "mindset": "One sentence about how to approach ${city} for the first time"
    },
    "repeat": {
      "goDeeper": ["3-4 things repeat visitors discover"],
      "neighborhoods": ["off-the-beaten neighborhoods"],
      "local": "One thing only locals and repeat visitors know"
    }
  },

  "seasonalIntelligence": {
    "peakSeason": { "months": "list months", "weather": "specific temps/conditions", "crowds": "honest crowd assessment", "prices": "price premium %", "verdict": "one honest verdict" },
    "shoulderSeason": { "months": "list months", "why": "why it's actually better for most travelers" },
    "offSeason": { "months": "list months", "reality": "what actually happens — monsoon/extreme heat/cold", "hiddenGem": "one reason some travelers prefer this time" },
    "bestMonth": "specific month with one-line reason",
    "worstMonth": "specific month with honest reason"
  },

  "commonRegrets": [
    "Most visitors regret [specific mistake #1]",
    "Most visitors regret [specific mistake #2]",
    "Most visitors regret [specific mistake #3]"
  ],

  "antiPatterns": [
    "Specific bad combination #1 — why it fails",
    "Specific bad combination #2 — why it fails",
    "Bad timing/sequence that ruins the experience"
  ],

  "tripLengthGuide": {
    "one_day": { "possible": true/false, "itinerary": "if possible, what to do", "verdict": "honest verdict" },
    "two_days": { "focus": "what this trip covers", "misses": "what you miss" },
    "three_to_four_days": { "focus": "what this trip covers", "sweetSpot": true/false },
    "five_to_seven_days": { "focus": "deep exploration targets", "whoFor": "type of traveler" },
    "recommended": "X days — one sentence why"
  },

  "residentSunday": "A ${city} resident with one free Sunday: specific morning routine → specific lunch spot → specific afternoon → specific evening. Real place names. No generic activities.",

  "dayMemoryTargets": {
    "arrival": "The one specific moment on arrival day they will remember in 5 years — not the attraction, the MOMENT",
    "peak": "The peak day memory target — specific and earned",
    "departure": "How the departure should feel — the last image that stays with them"
  },

  "transportationReality": {
    "fromDelhi": { "train": "USE THIS EXACT DATA: ${trainRef}", "bus": "honest assessment", "flight": "if applicable", "recommended": "what SKYmora recommends and why", "budgetTip": "how to save ₹500-2000 on the journey" },
    "fromMumbai": { "train": "specific train name, number, duration, price", "flight": "if applicable", "recommended": "recommendation" },
    "fromBangalore": { "train": "specific details", "flight": "if applicable", "recommended": "recommendation" },
    "localTransport": { "best": "what works best locally", "avoid": "what to avoid", "appRecommendation": "specific app if any", "autoRickshaw": "honest assessment", "cost": "daily local transport budget" }
  },

  "scamPrevention": [
    { "scam": "specific scam name", "howItWorks": "one sentence", "prevention": "specific prevention", "ifItHappens": "what to do" }
  ],

  "foodSafety": {
    "safeStreetFood": ["3-5 specific safe street food items/stalls"],
    "avoidList": ["what to avoid and why — specific"],
    "waterAdvice": "specific and honest",
    "trustedDhabas": "how to identify trustworthy local dhabas",
    "mustEat": ["3-5 specific dishes this place is famous for — with where to eat them"],
    "touristTrap": "specific food trap tourists fall into here"
  },

  "culturalIntelligence": {
    "dressCode": "specific to this destination",
    "photographyRules": "specific places where photography is restricted",
    "templeEtiquette": "if applicable",
    "timing": "specific cultural timing tip",
    "localCustom": "one specific local custom visitors should know"
  },

  "budgetReality": {
    "backpacker": { "perDay": "₹X,XXX", "accommodation": "specific type and cost", "food": "specific approach", "transport": "specific approach" },
    "comfortable": { "perDay": "₹X,XXX", "accommodation": "specific type and cost", "food": "approach", "includes": "what this budget unlocks" },
    "premium": { "perDay": "₹XX,XXX", "accommodation": "specific hotels", "experience": "what premium gets you here" },
    "luxury": { "perDay": "₹XX,XXX+", "accommodation": "luxury options", "note": "honest note about whether luxury adds value here" }
  },

  "whoThisIsNotFor": [
    "Travelers who [specific type] will be disappointed because [specific reason]",
    "If you want [X], ${city} is the wrong choice — [alternative] is better",
    "Anyone expecting [Y] will find [honest reality]"
  ],

  "insiderIntelligence": [
    { "tip": "verbatim insider tip #1 — specific place, price, timing", "category": "food/transport/experience/timing" },
    { "tip": "verbatim insider tip #2", "category": "" },
    { "tip": "verbatim insider tip #3", "category": "" },
    { "tip": "verbatim insider tip #4", "category": "" },
    { "tip": "verbatim insider tip #5", "category": "" }
  ],

  "combinationIntelligence": [
    {
      "sequence": ["activity 1", "activity 2", "activity 3"],
      "emotionalArc": "why this sequence creates a better emotional experience than the alternatives",
      "bestFor": ["traveler types"]
    }
  ],

  "photographyIntelligence": {
    "bestShotLocations": [
      { "name": "location name", "what": "what to photograph", "bestTime": "specific time", "tip": "insider tip" }
    ],
    "goldenHour": "specific timing for this city/season",
    "restrictedAreas": ["places where photography is not allowed"],
    "tip": "one photography insight specific to this destination"
  },

  "accessibility": {
    "wheelchairFriendly": "honest assessment",
    "majorChallenges": "specific accessibility challenges",
    "seniorFriendlyScore": 7,
    "note": "specific note for travelers with mobility needs"
  },

  "nearbyDestinations": [
    { "city": "city name", "distance": "Xkm/hours", "travelTime": "X hours", "how": "how to get there", "whyCombine": "specific reason to combine" }
  ],

  "hardFacts": {
    "bestMonthToVisit": "specific month",
    "avoidMonth": "specific month with reason",
    "minimumDays": 2,
    "recommendedDays": 3,
    "altitude": "if relevant",
    "timezone": "IST (UTC+5:30)"
  },

  "liveIntelligence": {
    "lastChecked": "2026-06",
    "seasonalNow": "current season reality as of June 2026",
    "currentAlerts": [],
    "entryRequirements": "any permits or special requirements"
  }
}

QUALITY STANDARD — READ THIS CAREFULLY:

BANNED PHRASES (any response containing these fails):
"unique blend", "every corner holds", "waiting to be discovered", "unlike any other",
"perfect for all types", "something for everyone", "vibrant", "bustling", "nestled",
"picturesque", "serene beauty", "breathtaking views", "stunning landscapes",
"world-class", "must-visit", "hidden gem", "off the beaten path", "rich culture",
"warm hospitality", "warm and welcoming", "truly special", "unforgettable experience"

WRITING STYLE:
- whyPeopleFallInLove: Write like a person who has been there 10 times. Reference a SPECIFIC place, smell, moment. Example: "People arrive for the white-water rafting. They stay for the evening aarti at Triveni Ghat — 300 candles, Sanskrit chants, the river carrying everything. They return because Rishikesh is the only place where your WhatsApp goes quiet without effort."
- honestTruth: The ONE thing most travel writers miss. Should be slightly uncomfortable or surprising.
- localTruths: Each must follow: "Most visitors [generic tourist behavior]. [The honest contrast — what locals/insiders know]."
- Every INR figure must be realistic for 2026

INDIA-SPECIFIC REQUIREMENTS:
- transportationReality.fromDelhi MUST have specific train name + number (e.g., "Shatabdi Express 12017, departs 6:45am, 5.5 hours, ₹755 CC class")
- scamPrevention must name the specific scam as it's known locally
- foodSafety.mustEat must name the specific restaurant or area, not just the dish
- budgetReality must be realistic — ₹2,000/day backpacker must actually be achievable`;
}

// ── Main generator ──
async function generateCityFile(cityData) {
  const { city, state } = cityData;
  const filename = city.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '') + '.json';
  const filepath = path.join(DEST_DIR, filename);

  if (fs.existsSync(filepath)) {
    const existing = JSON.parse(fs.readFileSync(filepath, 'utf8'));
    if (existing._schemaVersion === '4.0-india') {
      console.log(`⏭️  Skipping ${city} — already at v4.0-india`);
      return;
    }
  }

  console.log(`\n🏗️  Building: ${city}, ${state}...`);

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      response_format: { type: "json_object" },
      temperature: 0.7,
      max_tokens: 3500,
      messages: [
        {
          role: "system",
          content: "You are an expert Indian travel writer and local knowledge curator. You know every city deeply — real prices, real transport options, real scams, real food. Never generic. Always specific. Return only valid JSON."
        },
        { role: "user", content: buildIndianCityPrompt(cityData) }
      ]
    });

    const raw = completion.choices[0]?.message?.content;
    if (!raw) throw new Error("No response");

    // Clean common JSON issues before parsing
    const cleaned = raw
      .replace(/[ --]/g, ' ') // remove control chars
      .replace(/,\s*}/g, '}')  // trailing commas
      .replace(/,\s*]/g, ']'); // trailing commas in arrays

    let data;
    try {
      data = JSON.parse(cleaned);
    } catch(parseErr) {
      // Try extracting JSON between first { and last }
      const start = cleaned.indexOf('{');
      const end = cleaned.lastIndexOf('}');
      if (start !== -1 && end !== -1) {
        data = JSON.parse(cleaned.slice(start, end + 1));
      } else {
        throw parseErr;
      }
    }
    data.destination = data.destination || city;
    data._schemaVersion = "4.0-india";
    data.lastUpdated = "2026-06";

    fs.writeFileSync(filepath, JSON.stringify(data, null, 2));
    console.log(`✅ ${city} — saved to ${filename}`);
    return { city, success: true, filename };

  } catch (err) {
    console.error(`❌ ${city} failed:`, err.message);
    return { city, success: false, error: err.message };
  }
}

// ── Run ──
const args = process.argv.slice(2);
const target = args[0]?.toLowerCase();

if (!target) {
  console.log('Usage: node build-india-knowledge.js <cityname>');
  console.log('       node build-india-knowledge.js all');
  console.log('\nAvailable cities:');
  INDIA_CITIES.forEach(c => console.log(`  - ${c.city} (${c.state})`));
  process.exit(0);
}

if (target === 'all') {
  console.log(`🚀 Building all ${INDIA_CITIES.length} Indian city files...`);
  console.log('This will take approximately', Math.ceil(INDIA_CITIES.length * 25 / 60), 'minutes\n');

  // Process in batches of 3 to avoid rate limits
  const batchSize = 3;
  const results = [];
  for (let i = 0; i < INDIA_CITIES.length; i += batchSize) {
    const batch = INDIA_CITIES.slice(i, i + batchSize);
    const batchResults = await Promise.all(batch.map(c => generateCityFile(c)));
    results.push(...batchResults);
    if (i + batchSize < INDIA_CITIES.length) {
      await new Promise(r => setTimeout(r, 2000)); // rate limit gap
    }
  }

  const success = results.filter(r => r?.success).length;
  const failed = results.filter(r => r && !r.success);
  console.log(`\n✅ Complete: ${success}/${INDIA_CITIES.length} cities built`);
  if (failed.length > 0) {
    console.log('❌ Failed:', failed.map(f => f.city).join(', '));
  }

} else {
  // Build single city
  const cityData = INDIA_CITIES.find(c =>
    c.city.toLowerCase() === target ||
    c.city.toLowerCase().includes(target)
  );

  if (!cityData) {
    console.log(`City "${target}" not found. Available: ${INDIA_CITIES.map(c=>c.city).join(', ')}`);
    process.exit(1);
  }

  await generateCityFile(cityData);
}
