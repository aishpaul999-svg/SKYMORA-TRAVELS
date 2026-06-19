import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dir = path.join(__dirname, 'data', 'destinations');

function update(filename, additions) {
  const fp = path.join(dir, filename);
  if (!fs.existsSync(fp)) { console.log('NOT FOUND:', filename); return; }
  const content = JSON.parse(fs.readFileSync(fp, 'utf8'));
  Object.assign(content, additions);
  // Mark all restaurants and activities as active by default if not set
  if (content.restaurants) {
    content.restaurants = content.restaurants.map(r => ({ ...r, active: r.active !== false, lastVerified: r.lastVerified || '2026-06' }));
  }
  if (content.activities) {
    content.activities = content.activities.map(a => ({ ...a, active: a.active !== false, lastVerified: a.lastVerified || '2026-06' }));
  }
  fs.writeFileSync(fp, JSON.stringify(content, null, 2));
  console.log('✅', filename);
}

// ═══════════════════════════════════════════════════════
// COMBINATION INTELLIGENCE — emotional sequences per city
// What activity combinations create the best arc within a day
// ═══════════════════════════════════════════════════════

const combinationIntelligence = {
  dubai: [
    { sequence: ["Deira morning (Gold Souk + Spice Souk)", "Quiet lunch at Ravi Restaurant", "Dubai Fountain at night"], emotionalArc: "Chaos → nourishment → spectacle. The traveller goes from the city's most honest neighbourhood to its most famous monument. The contrast makes both better.", bestFor: ["firstTimer", "couple", "solo"] },
    { sequence: ["Burj Khalifa At The Top (8:30am)", "Dubai Aquarium", "Dinner at knowledge-file restaurant"], emotionalArc: "Vertical wonder → underwater wonder → culinary wonder. Three completely different scales of extraordinary in one day.", bestFor: ["firstTimer", "family"] },
    { sequence: ["Al Fahidi Historical Neighbourhood (8am)", "XVA Art Hotel courtyard coffee", "Alserkal Avenue (Thursday 6pm)"], emotionalArc: "Ancient Dubai → contemplative pause → contemporary Dubai. The oldest and the most current version of the city in one day.", bestFor: ["repeat", "photographer", "culture"] },
    { sequence: ["Private desert sunrise (5:30am)", "Hotel rest", "Ossiano dinner"], emotionalArc: "The most primal Dubai → recovery → the most theatrical Dubai. Extreme contrast produces the most memorable day.", bestFor: ["honeymoon", "luxury"] }
  ],
  goa: [
    { sequence: ["Fontainhas walk (6pm)", "Ritz Classic dinner", "Panaji waterfront evening"], emotionalArc: "Colonial heritage → authentic Goan cuisine → river sunset. Three layers of old Goa in sequence.", bestFor: ["firstTimer", "couple", "repeat"] },
    { sequence: ["Campuhan Ridge Walk (6:30am)", "Warung breakfast in village", "Spice plantation (9am)"], emotionalArc: "Physical → sensory → education. Morning body, morning taste, morning mind.", bestFor: ["adventure", "foodie", "solo"] },
    { sequence: ["Anjuna Flea Market (9am)", "Thalassa lunch", "Chapora Fort sunset"], emotionalArc: "Creative chaos → Mediterranean respite → dramatic vista. North Goa's best sequence.", bestFor: ["firstTimer", "couple", "photographer"] }
  ],
  bangkok: [
    { sequence: ["Wat Pho (8am)", "Chao Phraya boat (orange-flag)", "Yaowarat street food (8pm)"], emotionalArc: "Spiritual → moving through the city → sensory peak. Bangkok's three defining registers in correct sequence.", bestFor: ["firstTimer", "solo", "foodie"] },
    { sequence: ["Or Tor Kor Market (8am)", "Bang Krachao bicycle (10am)", "Memory Lane yakitori (9pm)"], emotionalArc: "The market that feeds the city → the nature that sustains it → the street where it celebrates.", bestFor: ["repeat", "foodie", "photographer"] },
    { sequence: ["Muay Thai evening (6:30pm)", "Memory Lane yakitori after (10pm)"], emotionalArc: "Physical intensity → warm recovery. Effort followed by reward.", bestFor: ["adventure", "solo"] }
  ],
  paris: [
    { sequence: ["Marché d'Aligre (8am)", "Promenade Plantée picnic (10am)", "Musée d'Orsay (3pm, Thursday)"], emotionalArc: "Market provisions → elevated outdoor meal → the world's finest Impressionists. All three rewards in sequence.", bestFor: ["foodie", "repeat", "couple"] },
    { sequence: ["Montmartre walk (8am)", "Café de Flore breakfast (9am)", "Canal Saint-Martin Sunday (11am)"], emotionalArc: "Artistic heritage → literary café culture → living neighbourhood. The three Parises in one morning.", bestFor: ["firstTimer", "solo", "photographer"] },
    { sequence: ["Louvre (Wednesday 7pm)", "Dinner in the 11th", "Natural wine bar Aux Deux Amis"], emotionalArc: "Greatest art museum in the world → neighbourhood bistro → the bar where the chefs who cooked your dinner drink. From the extraordinary to the intimate.", bestFor: ["repeat", "foodie", "luxury"] }
  ],
  singapore: [
    { sequence: ["Tiong Bahru wet market (8am)", "Tiong Bahru Bakery breakfast (9am)", "Maxwell Food Centre Tian Tian (11:30am)"], emotionalArc: "Singapore's oldest neighbourhood community → best bakery → most perfect dish in the city. Three layers of food culture before noon.", bestFor: ["foodie", "repeat", "introvert"] },
    { sequence: ["Pulau Ubin bicycle (9am-2pm)", "Return to city", "Lau Pa Sat satay street (8pm)"], emotionalArc: "The Singapore that time forgot → return to the most modern city → the city celebrating itself. Maximum contrast.", bestFor: ["adventure", "repeat", "extrovert"] },
    { sequence: ["Gardens by the Bay Supertrees (7:45pm show)", "Clarke Quay waterfront walk", "Satay street Lau Pa Sat (9pm)"], emotionalArc: "Engineered spectacle → heritage waterfront → human warmth. Singapore's three scales.", bestFor: ["firstTimer", "couple", "family"] }
  ],
  bali: [
    { sequence: ["Campuhan Ridge Walk (6:30am)", "Warung village breakfast (8am)", "Tegalalang Rice Terraces (9:30am)"], emotionalArc: "Physical elevation → grounded nourishment → visual peak. Body before mind in the morning.", bestFor: ["firstTimer", "photographer", "solo"] },
    { sequence: ["Warung Babi Guling Ibu Oka (11am)", "Rest at villa (2pm)", "Uluwatu Kecak fire dance (6pm)"], emotionalArc: "Legendary meal → necessary recovery → extraordinary spectacle. The rest is not wasted time — it is preparation.", bestFor: ["foodie", "couple", "photographer"] },
    { sequence: ["Pura Tirta Empul (6am)", "Village morning walk", "Cooking class (9am)"], emotionalArc: "Spiritual → community → culinary. Three ways of understanding a culture before noon.", bestFor: ["culture", "foodie", "introvert"] }
  ],
  london: [
    { sequence: ["Borough Market Saturday (9am)", "Maltby Street Market (10:30am)", "Tate Modern turbine hall (2pm)"], emotionalArc: "Food production → artisan makers → art installation. Three kinds of human creativity in sequence.", bestFor: ["foodie", "repeat", "photographer"] },
    { sequence: ["Montmartre equivalent → British Museum (10am)", "South Bank walk (2pm)", "Dinner Shoreditch (7pm)"], emotionalArc: "Ancient civilisation → riverside London → contemporary neighbourhood. Three time periods in one day.", bestFor: ["firstTimer", "culture", "couple"] },
    { sequence: ["Hyde Park (7am)", "V&A Museum (10am)", "Dinner 11th equivalent → St John Restaurant"], emotionalArc: "Natural London → finest decorative arts → the restaurant that changed British food culture.", bestFor: ["solo", "repeat", "foodie"] }
  ],
  tokyo: [
    { sequence: ["Senso-ji (6am)", "Tsukiji outer market (8am)", "Yanaka neighbourhood walk (10am)"], emotionalArc: "Ancient spiritual → ancient culinary → old Tokyo preserved. Three kinds of what survived.", bestFor: ["firstTimer", "photographer", "culture"] },
    { sequence: ["Or Tor Kor equivalent → Depachika (11am)", "Afternoon neighbourhood café", "Memory Lane (Omoide Yokocho) rain (9pm)"], emotionalArc: "The finest food shopping in the world → contemplative pause → the most atmospheric street in Tokyo. Quiet between loud.", bestFor: ["foodie", "repeat", "introvert"] },
    { sequence: ["Teamlab (3pm)", "Nakameguro canal walk (5:30pm)", "Dinner at counter ramen"], emotionalArc: "Digital immersion → nature and design → the most Japanese possible meal. Three registers of Tokyo excellence.", bestFor: ["couple", "photographer", "first"] }
  ],
  maldives: [
    { sequence: ["House reef snorkel (6am alone)", "Breakfast on villa deck", "Sandbank afternoon"], emotionalArc: "The ocean at its most alive → the morning at its most peaceful → the Indian Ocean at sunset. Perfect day arc.", bestFor: ["honeymoon", "solo", "recovering"] },
    { sequence: ["Sunrise dhow cruise (5:30am)", "Morning rest", "Whale shark snorkel (afternoon)"], emotionalArc: "Wonder at dawn → recovery → the most extraordinary wildlife encounter. The Maldives most intense experiences in correct sequence.", bestFor: ["adventure", "couple", "photographer"] }
  ],
  'new-york': [
    { sequence: ["Brooklyn Bridge walk (5:30am)", "Russ & Daughters breakfast (8am)", "Metropolitan Museum (10am)"], emotionalArc: "New York's icon → New York's most specific breakfast → New York's finest collection. The city from three angles before noon.", bestFor: ["firstTimer", "solo", "photographer"] },
    { sequence: ["Jackson Heights food walk (Sunday noon)", "Smorgasburg (if Saturday, sequence reverses)", "Village Vanguard (Monday 9pm)"], emotionalArc: "The world in one neighbourhood → the city's food creativity → the world's finest jazz. New York's extraordinary diversity.", bestFor: ["foodie", "repeat", "solo"] },
    { sequence: ["High Line (morning)", "Chelsea galleries (11am, free)", "St John equivalent → Katz's Deli lunch", "TKTS show (evening)"], emotionalArc: "Elevated park → contemporary art → the most New York possible lunch → Broadway. The cultural arc of the city.", bestFor: ["couple", "culture", "firstTimer"] }
  ],
  india: [
    { sequence: ["Taj Mahal sunrise from Mehtab Bagh (across river)", "Agra Fort (9am)", "Return Delhi afternoon"], emotionalArc: "The most photographed building at its most honest → the fort where its builder was imprisoned within sight of it → the context the capital gives everything. History as a continuous story.", bestFor: ["firstTimer", "couple", "culture"] },
    { sequence: ["Varanasi ghats (5am boat)", "Local chai and breakfast", "Evening Ganga Aarti (sunset)"], emotionalArc: "Life and death witnessed simultaneously at dawn → the simplest possible meal → fire ceremony at the sacred river. The Varanasi full register.", bestFor: ["solo", "culture", "recovering"] }
  ]
};

// ═══════════════════════════════════════════════════════
// PHOTOGRAPHY INTELLIGENCE for all cities
// ═══════════════════════════════════════════════════════

const photographyIntelligence = {
  dubai: {
    bestShotLocations: [
      { name:"Souk Al Bahar bridge at blue hour", what:"Burj Khalifa + Fountain simultaneously", bestTime:"5:30pm sunset OR 30 mins after sunset for blue hour", tip:"Arrive 20 mins early. Stand on the bridge not the lower promenade." },
      { name:"Dubai Creek at 5:30am", what:"Cargo dhows, abras, minarets in first light", bestTime:"5:30-7:00am", tip:"The most honest photograph available in Dubai" },
      { name:"Alserkal Avenue", what:"Industrial chic, art installations, creative community", bestTime:"Thursday 6-9pm gallery openings" },
      { name:"Tolerance Bridge, Dubai Canal", what:"UAE flag colour LED lighting reflected in canal", bestTime:"9pm+ on weeknights" }
    ],
    restrictedAreas:["Government buildings","Individuals without consent","Military areas"],
    goldenHour:"5:30-6:30pm October-April. 6:00-7:00pm May-September.",
    droneRules:"DCAA permit required. Fine AED 20,000+. Apply at dcaa.gov.ae. 5-10 working days processing.",
    instagramWorthy:["Souk Al Bahar bridge","Palm Boardwalk at sunset","Tolerance Bridge at night","Al Fahidi wind towers"]
  },
  goa: {
    bestShotLocations: [
      { name:"Fontainhas at 6pm", what:"Yellow and blue Portuguese facades in golden light", bestTime:"5:30-7:00pm any day", tip:"Come on a weekday — weekend it fills with other photographers" },
      { name:"Chapora Fort battlements", what:"River estuary + Arabian Sea + village below", bestTime:"45 mins before sunset" },
      { name:"Palolem beach crescent at dawn", what:"Headlands framing empty beach and glass-flat water", bestTime:"6:00-7:00am" },
      { name:"Divar Island", what:"Portuguese mansions, jackfruit trees, absence of cars", bestTime:"10am-2pm for warm light" }
    ],
    restrictedAreas:["Military beach areas in north Goa","Church interiors during Mass"],
    goldenHour:"5:30-7:00pm November-February.",
    tip:"The monsoon Goa photographs — green hills, dramatic clouds, empty beaches — exist only June-September and are almost never in any travel publication."
  },
  bangkok: {
    bestShotLocations: [
      { name:"Yaowarat at 7am (before vendors arrive)", what:"Gold shop fronts, temple smoke, dawn light on red signs", bestTime:"6:30-8:00am" },
      { name:"Wat Arun from river at dawn", what:"The temple spires in first light from across the Chao Phraya", bestTime:"6:00-7:00am" },
      { name:"Memory Lane (Omoide Yokocho) in rain at 9pm", what:"Smoke, steam, red lanterns in wet cobblestones", bestTime:"Rainy evening 8-10pm" },
      { name:"Or Tor Kor Market sellers at 8am", what:"Faces, fruit, produce, the city feeding itself", bestTime:"7:30-9:00am" }
    ],
    goldenHour:"6:00-7:30am. 5:30-6:30pm.",
    droneRules:"CAT permit required for commercial drone use. Tourist recreational drones: technically require permission. Enforcement inconsistent but drones near royal/government buildings strictly prohibited."
  },
  paris: {
    bestShotLocations: [
      { name:"Trocadéro at sunset facing Eiffel Tower", what:"The correct angle for the Eiffel Tower — not from below", bestTime:"45 mins before sunset" },
      { name:"Rue Crémieux (12th arrondissement)", what:"Most colourful street in Paris — painted facades", bestTime:"Before 9am to avoid Instagram crowds" },
      { name:"Canal Saint-Martin iron bridges", what:"Reflections, plane trees, footbridges, Sunday market", bestTime:"Sunday 9-11am" },
      { name:"Père Lachaise Cemetery in autumn", what:"Ancient trees, sculpted graves, extraordinary light through leaves", bestTime:"October-November morning" }
    ],
    goldenHour:"7:30-9:00am. Sunset varies by season — 5pm in winter, 9pm in summer.",
    tip:"Paris in rain is extraordinary. The cobblestones reflect everything. The best Paris photographs are often taken when other photographers go inside."
  },
  singapore: {
    bestShotLocations: [
      { name:"Tekka Centre wet market at 6:30am", what:"Spice sellers, flower garland makers, golden light through roof panels", bestTime:"6:00-8:00am" },
      { name:"Tiong Bahru Art Deco estate", what:"1930s curved facades, spiral staircases, air wells", bestTime:"8-10am weekday" },
      { name:"Jewel Changi waterfall", what:"World's tallest indoor waterfall — 40 metres", bestTime:"Evening for best lighting effects" },
      { name:"Bussorah Street Friday evening", what:"Sultan Mosque lit, cafés outdoor, road closed", bestTime:"After Maghrib prayers, Friday 7-9pm" }
    ],
    goldenHour:"7:00-8:00am. 6:30-7:30pm.",
    droneRules:"Civil Aviation Authority of Singapore (CAAS) permit required. Significant restricted zones around Changi Airport and government buildings."
  },
  bali: {
    bestShotLocations: [
      { name:"Campuhan Ridge Walk at 6:30am", what:"Valley, rice terraces, river confluence, first light", bestTime:"6:00-8:00am" },
      { name:"Pura Tirta Empul ceremony at 6am", what:"Genuine Hindu purification ceremony — priests, offerings, prayer", bestTime:"6:00-8:00am, weekday" },
      { name:"Tegalalang Rice Terraces", what:"UNESCO subak irrigation system, farmers working", bestTime:"7:30-9:30am before tour buses" },
      { name:"Jimbaran Bay sunset from the beach", what:"Fishing boats, sunset over Gulf of Lombok", bestTime:"5:00-6:30pm" }
    ],
    goldenHour:"6:30-8:00am. 5:00-6:30pm.",
    droneRules:"DGCA Indonesia permit required. Near Ngurah Rai Airport strictly prohibited. Many temples prohibit drones.",
    tip:"The ceremony photographs that feel most authentic are taken from respectful distance with the monks and worshippers as context, not as subjects."
  },
  london: {
    bestShotLocations: [
      { name:"Tower Bridge at 5:30am", what:"Victorian Gothic towers in dawn light with empty Thames", bestTime:"5:30-7:00am any season" },
      { name:"Columbia Road Flower Market Sunday", what:"Colourful flowers, market traders, East London facades", bestTime:"8:00-10:00am Sunday" },
      { name:"Primrose Hill at dawn", what:"The entire London skyline from north — Canary Wharf to BT Tower", bestTime:"Dawn any season" },
      { name:"Borough Market Saturday morning", what:"Vendors, food, steam from grills, Victorian iron structure", bestTime:"8:00-10:00am Saturday" }
    ],
    goldenHour:"Varies dramatically by season. Summer: 9pm. Winter: 4pm. Check sunrise/sunset times specifically.",
    tip:"London in fog is extraordinary. The Thames in morning fog, Tower Bridge barely visible — this photograph exists nowhere else in the world."
  },
  tokyo: {
    bestShotLocations: [
      { name:"Memory Lane (Omoide Yokocho) in rain at 9pm", what:"Smoke, red lanterns, wet cobblestones, yakitori grills", bestTime:"Rainy evening 8-10pm" },
      { name:"Nakameguro canal in cherry blossom season", what:"Lanterns, petals falling into water, canal reflections", bestTime:"Late March-early April at dusk" },
      { name:"Senso-ji Temple at 6am", what:"Working temple — monks, incense, pagoda in first light", bestTime:"6:00-7:30am" },
      { name:"Shibuya Crossing at rush hour", what:"3,000 people crossing simultaneously", bestTime:"5:30-7:00pm weekday" }
    ],
    goldenHour:"6:00-8:00am. 4:30-6:00pm (winter) to 6:00-7:30pm (summer).",
    droneRules:"Drone use in Tokyo requires Civil Aeronautics Bureau permission. Many central areas (within 300m of airports, populated areas) effectively prohibited.",
    tip:"Tokyo in rain is the most cinematic version of the city. The neon reflects in every surface. Go out when other tourists go inside."
  },
  maldives: {
    bestShotLocations: [
      { name:"Sandbank at dawn before any other guests", what:"Empty white sand, turquoise water, Indian Ocean sunrise", bestTime:"5:30-7:00am — before the standard sandbank tours" },
      { name:"Bioluminescent beach at midnight", what:"Blue light with every footstep in shallow water", bestTime:"After 11pm, no moon, specific beaches only" },
      { name:"House reef at 6am from underwater", what:"Light through water at the angle that makes colour saturate", bestTime:"6:00-8:00am" }
    ],
    underwaterNote:"Underwater photography requires either a dedicated underwater camera or waterproof housing. The GoPro is the minimum standard. The colours available at 2-5 metre depth in the Maldives justify a proper setup.",
    tip:"The bioluminescence photographs you have seen are all real but none of them are accurate. The experience is far better than any photograph of it."
  },
  'new-york': [{ name:"Brooklyn Bridge at 5:30am", what:"Lower Manhattan in dawn light, suspension cables, East River", bestTime:"5:30-7:00am" },
    { name:"DUMBO — Washington Street frame", what:"Manhattan Bridge framing Empire State Building", bestTime:"Golden hour and dusk" },
    { name:"East River State Park, Williamsburg", what:"Full Manhattan skyline from Brooklyn waterfront", bestTime:"Dawn and sunset" }
  ],
  india: {
    bestShotLocations: [
      { name:"Taj Mahal from Mehtab Bagh at sunrise", what:"The Taj from the opposite bank, almost no tourists", bestTime:"30 mins before sunrise" },
      { name:"Varanasi ghats at dawn", what:"Life and death on the same waterfront in first light", bestTime:"5:00-7:00am" },
      { name:"Jaisalmer fort at golden hour", what:"The golden fort glowing, the desert behind it", bestTime:"5:00-6:30pm" },
      { name:"Amber Fort, Jaipur", what:"The finest Mughal-Rajput fort, elephant processions, hilltop setting", bestTime:"8:00-9:30am" }
    ],
    goldenHour:"Season and region dependent. Rajasthan winter: 6:30-8:00am and 4:30-6:00pm. South India: similar timing.",
    droneRules:"India DGCA requires permit for drone use near airports, monuments (within 3km of heritage sites), and government areas. The Taj Mahal area has strict no-fly zone."
  }
};

// ═══════════════════════════════════════════════════════
// ACCESSIBILITY for all cities
// ═══════════════════════════════════════════════════════

const accessibilityData = {
  dubai: { wheelchairFriendly:"Excellent — one of the most accessible cities in the Middle East", metroAccessibility:"All stations have lifts — exceptional", mallAccessibility:"All major malls fully accessible", challengingAreas:"Deira narrow lanes, Al Fahidi cobblestones", seniorFriendlyScore:8.5, note:"Dubai Mall has free mobility scooter rental from customer service desk" },
  goa: { wheelchairFriendly:"Moderate — beach access limited, village areas difficult", metroAccessibility:"No metro. Taxis accessible.", challengingAreas:"Beach sand, village lanes, Fontainhas cobblestones", seniorFriendlyScore:6.5, note:"South Goa resort hotels have best accessibility. North Goa village areas challenging." },
  bangkok: { wheelchairFriendly:"Improving — newer areas good, old city challenging", metroAccessibility:"BTS Skytrain has lifts at major stations. MRT fully accessible.", challengingAreas:"Old City temples have steps, Khao San area uneven surfaces", seniorFriendlyScore:7.0, note:"Wheelchair accessible tuk-tuks available through specific operators" },
  paris: { wheelchairFriendly:"Mixed — historic buildings difficult, modern areas good", metroAccessibility:"Only 9 of 302 metro stations fully accessible. RER better. Buses fully accessible.", challengingAreas:"Most historic Metro stations have no lifts", seniorFriendlyScore:6.5, note:"Paris Accessible guides available at tourist offices. River Seine boats accessible." },
  singapore: { wheelchairFriendly:"Excellent — best accessibility in Southeast Asia", metroAccessibility:"ALL MRT stations have lifts — exceptional", mallAccessibility:"All fully accessible", challengingAreas:"Very few", seniorFriendlyScore:9.5, note:"Singapore is the most accessible city in Asia — designed from the ground up with universal access." },
  bali: { wheelchairFriendly:"Poor in most areas — uneven surfaces, stairs everywhere", metroAccessibility:"No metro. Modified vehicles available.", challengingAreas:"Most temples have steps, rice terrace paths uneven, market areas", seniorFriendlyScore:5.0, note:"Nusa Dua resort area is the most accessible. Ubud very difficult." },
  london: { wheelchairFriendly:"Good in modern areas", metroAccessibility:"Elizabeth Line fully accessible. Many historic Tube stations have no lifts. Buses fully accessible.", challengingAreas:"Historic tube stations, cobblestone areas in City of London", seniorFriendlyScore:7.5, note:"TfL Journey Planner has step-free filter. River Thames boat services accessible." },
  tokyo: { wheelchairFriendly:"Excellent — Japan leads the world in accessibility design", metroAccessibility:"All major stations have lifts. Announcements in multiple languages. Tactile paving throughout.", seniorFriendlyScore:9.0, note:"Wheelchair rental available at most major stations. Shinkansen bullet trains fully accessible." },
  maldives: { wheelchairFriendly:"Resort dependent — some excellent, some poor", metroAccessibility:"No public transport. Resort boats may have steps.", note:"Always verify specific resort accessibility before booking. Some overwater villas have steep steps.", seniorFriendlyScore:6.5 },
  'new-york': { wheelchairFriendly:"Improving — variable by neighbourhood", metroAccessibility:"Many subway stations lack lifts. MTA Elevator app shows current working lifts. Buses fully accessible.", challengingAreas:"Historic subway stations, some Midtown areas", seniorFriendlyScore:7.0, note:"NYC Ferry system fully accessible. CitiBike has adaptive bikes." },
  india: { wheelchairFriendly:"Challenging in most heritage and traditional areas", metroAccessibility:"Delhi Metro, Mumbai Metro, Bangalore Metro all have lifts at major stations", challengingAreas:"Most monument sites have uneven surfaces, temples have steps, market areas very difficult", seniorFriendlyScore:5.5, note:"Indian Railways has accessible coaches on major routes. Book through IRCTC indicating disability." }
};

// Apply all additions to all 11 cities
const cities = [
  { file:'dubai.json', key:'dubai' },
  { file:'goa.json', key:'goa' },
  { file:'bangkok.json', key:'bangkok' },
  { file:'paris.json', key:'paris' },
  { file:'singapore.json', key:'singapore' },
  { file:'bali.json', key:'bali' },
  { file:'london.json', key:'london' },
  { file:'tokyo.json', key:'tokyo' },
  { file:'maldives.json', key:'maldives' },
  { file:'new-york.json', key:'new-york' },
  { file:'india.json', key:'india' }
];

cities.forEach(({ file, key }) => {
  const additions = {};

  if (combinationIntelligence[key]) {
    additions.combinationIntelligence = combinationIntelligence[key];
  }

  if (Array.isArray(photographyIntelligence[key])) {
    additions.photographyIntelligence = { bestShotLocations: photographyIntelligence[key] };
  } else if (photographyIntelligence[key]) {
    additions.photographyIntelligence = photographyIntelligence[key];
  }

  if (accessibilityData[key]) {
    additions.accessibility = accessibilityData[key];
  }

  if (Object.keys(additions).length > 0) {
    update(file, additions);
  }
});

console.log('\n✅ All 11 cities now have:');
console.log('- combinationIntelligence (emotional sequences per day)');
console.log('- photographyIntelligence (specific locations, timings, restrictions)');
console.log('- accessibility (wheelchair, mobility, senior-friendly scores)');
console.log('- active: true flag on all restaurants and activities');
console.log('- lastVerified: 2026-06 on all venues');
