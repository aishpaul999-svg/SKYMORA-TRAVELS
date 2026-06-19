/**
 * SKYmora International Knowledge Base Builder v2
 * Builds all international cities at Dubai-level depth
 * Run: node build-international-knowledge.js [city] OR all
 */
import 'dotenv/config';
import OpenAI from 'openai';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const DEST_DIR = path.join(__dirname, 'data', 'destinations');

// ── Complete international city list ──
const INTL_CITIES = [
  // Southeast Asia — Thailand
  { city: 'Chiang Mai', country: 'Thailand', region: 'Southeast Asia', type: 'city/temples/trekking', flightFromDelhi: '4h 30min via Bangkok', visaForIndians: 'Thailand e-Visa USD 35, 60 days' },
  { city: 'Phuket', country: 'Thailand', region: 'Southeast Asia', type: 'beach/nightlife/islands', flightFromDelhi: '5h via Bangkok', visaForIndians: 'Thailand e-Visa USD 35' },
  { city: 'Krabi', country: 'Thailand', region: 'Southeast Asia', type: 'limestone cliffs/beaches', flightFromDelhi: '5h 30min via Bangkok', visaForIndians: 'Thailand e-Visa USD 35' },
  { city: 'Koh Samui', country: 'Thailand', region: 'Southeast Asia', type: 'island/beach/luxury', flightFromDelhi: '5h 30min via Bangkok', visaForIndians: 'Thailand e-Visa USD 35' },
  { city: 'Ayutthaya', country: 'Thailand', region: 'Southeast Asia', type: 'ancient temples/UNESCO', flightFromDelhi: '4h 30min to Bangkok + 1.5h bus', visaForIndians: 'Thailand e-Visa USD 35' },
  { city: 'Pai', country: 'Thailand', region: 'Southeast Asia', type: 'mountains/hippie/nature', flightFromDelhi: '4h 30min to Chiang Mai + 3h bus', visaForIndians: 'Thailand e-Visa USD 35' },
  // Southeast Asia — Indonesia
  { city: 'Jakarta', country: 'Indonesia', region: 'Southeast Asia', type: 'megacity/culture/food', flightFromDelhi: '6h 30min', visaForIndians: 'Bali Visa on Arrival USD 35' },
  { city: 'Lombok', country: 'Indonesia', region: 'Southeast Asia', type: 'island/beaches/Rinjani', flightFromDelhi: '8h via Singapore/KL', visaForIndians: 'Visa on Arrival USD 35' },
  { city: 'Yogyakarta', country: 'Indonesia', region: 'Southeast Asia', type: 'Borobudur/Prambanan/batik', flightFromDelhi: '7h via Singapore', visaForIndians: 'Visa on Arrival USD 35' },
  { city: 'Komodo', country: 'Indonesia', region: 'Southeast Asia', type: 'dragons/diving/islands', flightFromDelhi: '9h via Jakarta', visaForIndians: 'Visa on Arrival USD 35' },
  { city: 'Raja Ampat', country: 'Indonesia', region: 'Southeast Asia', type: 'diving/marine/remote', flightFromDelhi: '12h+ via Makassar', visaForIndians: 'Visa on Arrival USD 35' },
  // Southeast Asia — Malaysia
  { city: 'Kuala Lumpur', country: 'Malaysia', region: 'Southeast Asia', type: 'city/Petronas/food', flightFromDelhi: '5h', visaForIndians: 'Visa-free 30 days' },
  { city: 'Penang', country: 'Malaysia', region: 'Southeast Asia', type: 'street food/heritage/art', flightFromDelhi: '5h 30min', visaForIndians: 'Visa-free 30 days' },
  { city: 'Langkawi', country: 'Malaysia', region: 'Southeast Asia', type: 'island/beaches/duty-free', flightFromDelhi: '6h via KL', visaForIndians: 'Visa-free 30 days' },
  { city: 'Malacca', country: 'Malaysia', region: 'Southeast Asia', type: 'heritage/Portuguese/Dutch', flightFromDelhi: '5h 30min to KL + 2h bus', visaForIndians: 'Visa-free 30 days' },
  { city: 'Kota Kinabalu', country: 'Malaysia', region: 'Southeast Asia', type: 'Borneo/wildlife/diving', flightFromDelhi: '7h via KL', visaForIndians: 'Visa-free 30 days' },
  // Southeast Asia — Vietnam
  { city: 'Hanoi', country: 'Vietnam', region: 'Southeast Asia', type: 'capital/Old Quarter/history', flightFromDelhi: '5h', visaForIndians: 'e-Visa USD 25, apply 3 days ahead' },
  { city: 'Ho Chi Minh City', country: 'Vietnam', region: 'Southeast Asia', type: 'megacity/war history/food', flightFromDelhi: '5h 30min', visaForIndians: 'e-Visa USD 25' },
  { city: 'Hoi An', country: 'Vietnam', region: 'Southeast Asia', type: 'ancient town/lanterns/tailors', flightFromDelhi: '6h via Hanoi', visaForIndians: 'e-Visa USD 25' },
  { city: 'Ha Long Bay', country: 'Vietnam', region: 'Southeast Asia', type: 'UNESCO/karst/cruise', flightFromDelhi: '5h to Hanoi + 3.5h bus', visaForIndians: 'e-Visa USD 25' },
  { city: 'Da Nang', country: 'Vietnam', region: 'Southeast Asia', type: 'beach/modern/central Vietnam', flightFromDelhi: '5h 30min', visaForIndians: 'e-Visa USD 25' },
  { city: 'Sapa', country: 'Vietnam', region: 'Southeast Asia', type: 'rice terraces/trekking/hill tribes', flightFromDelhi: '5h to Hanoi + overnight train', visaForIndians: 'e-Visa USD 25' },
  { city: 'Hue', country: 'Vietnam', region: 'Southeast Asia', type: 'imperial capital/royal tombs', flightFromDelhi: '5h 30min', visaForIndians: 'e-Visa USD 25' },
  { city: 'Ninh Binh', country: 'Vietnam', region: 'Southeast Asia', type: 'inland Ha Long/cycling/temples', flightFromDelhi: '5h to Hanoi + 2h bus', visaForIndians: 'e-Visa USD 25' },
  // Southeast Asia — Cambodia
  { city: 'Siem Reap', country: 'Cambodia', region: 'Southeast Asia', type: 'Angkor Wat/temples/UNESCO', flightFromDelhi: '5h 30min via Bangkok', visaForIndians: 'e-Visa USD 36' },
  { city: 'Phnom Penh', country: 'Cambodia', region: 'Southeast Asia', type: 'capital/history/Killing Fields', flightFromDelhi: '5h via Bangkok', visaForIndians: 'e-Visa USD 36' },
  // Southeast Asia — Laos
  { city: 'Luang Prabang', country: 'Laos', region: 'Southeast Asia', type: 'UNESCO/monks/waterfalls', flightFromDelhi: '6h via Bangkok/Hanoi', visaForIndians: 'e-Visa USD 35' },
  { city: 'Vientiane', country: 'Laos', region: 'Southeast Asia', type: 'capital/temples/French colonial', flightFromDelhi: '5h 30min via Bangkok', visaForIndians: 'e-Visa USD 35' },
  // Southeast Asia — Philippines
  { city: 'Palawan', country: 'Philippines', region: 'Southeast Asia', type: 'beaches/islands/El Nido', flightFromDelhi: '7h via Manila', visaForIndians: 'Visa-free 30 days' },
  { city: 'Cebu', country: 'Philippines', region: 'Southeast Asia', type: 'beaches/diving/whaleshark', flightFromDelhi: '6h via Manila', visaForIndians: 'Visa-free 30 days' },
  { city: 'Boracay', country: 'Philippines', region: 'Southeast Asia', type: 'white beach/nightlife/watersports', flightFromDelhi: '7h via Manila', visaForIndians: 'Visa-free 30 days' },
  // Southeast Asia — Myanmar
  { city: 'Yangon', country: 'Myanmar', region: 'Southeast Asia', type: 'Shwedagon/colonial/market', flightFromDelhi: '3h', visaForIndians: 'e-Visa USD 50' },
  { city: 'Bagan', country: 'Myanmar', region: 'Southeast Asia', type: 'ancient temples/hot air balloon/sunset', flightFromDelhi: '3h to Yangon + 1.5h flight', visaForIndians: 'e-Visa USD 50' },
  // East Asia — Japan
  { city: 'Kyoto', country: 'Japan', region: 'East Asia', type: 'temples/geisha/traditional Japan', flightFromDelhi: '9h', visaForIndians: 'Japan visa required, VFS, 4 weeks' },
  { city: 'Osaka', country: 'Japan', region: 'East Asia', type: 'food/nightlife/castle', flightFromDelhi: '9h', visaForIndians: 'Japan visa required' },
  { city: 'Hiroshima', country: 'Japan', region: 'East Asia', type: 'peace/history/Miyajima', flightFromDelhi: '9h to Tokyo + Shinkansen', visaForIndians: 'Japan visa required' },
  { city: 'Nara', country: 'Japan', region: 'East Asia', type: 'deer/Todai-ji/ancient capital', flightFromDelhi: '9h to Osaka + 45min train', visaForIndians: 'Japan visa required' },
  { city: 'Hakone', country: 'Japan', region: 'East Asia', type: 'Fuji views/onsen/ryokan', flightFromDelhi: '9h to Tokyo + 1.5h', visaForIndians: 'Japan visa required' },
  { city: 'Sapporo', country: 'Japan', region: 'East Asia', type: 'snow festival/ski/beer/seafood', flightFromDelhi: '9h to Tokyo + 1.5h flight', visaForIndians: 'Japan visa required' },
  { city: 'Fukuoka', country: 'Japan', region: 'East Asia', type: 'ramen/yatai/Kyushu gateway', flightFromDelhi: '9h to Tokyo + 2h Shinkansen', visaForIndians: 'Japan visa required' },
  { city: 'Kanazawa', country: 'Japan', region: 'East Asia', type: 'samurai district/Kenroku-en/crafts', flightFromDelhi: '9h to Tokyo + 2.5h Shinkansen', visaForIndians: 'Japan visa required' },
  // East Asia — South Korea
  { city: 'Seoul', country: 'South Korea', region: 'East Asia', type: 'city/K-culture/food/temples', flightFromDelhi: '7h', visaForIndians: 'Korea visa required, VFS' },
  { city: 'Busan', country: 'South Korea', region: 'East Asia', type: 'beaches/seafood/Gamcheon', flightFromDelhi: '7h to Seoul + 3h KTX', visaForIndians: 'Korea visa required' },
  { city: 'Jeju Island', country: 'South Korea', region: 'East Asia', type: 'volcanic island/beaches/waterfalls', flightFromDelhi: '7h to Seoul + 1h flight', visaForIndians: 'Visa-free for Jeju' },
  { city: 'Gyeongju', country: 'South Korea', region: 'East Asia', type: 'ancient capital/UNESCO/Bulguksa', flightFromDelhi: '7h to Seoul + 2h KTX', visaForIndians: 'Korea visa required' },
  // East Asia — China
  { city: 'Beijing', country: 'China', region: 'East Asia', type: 'Great Wall/Forbidden City/hutongs', flightFromDelhi: '5h 30min', visaForIndians: 'China visa required, 3-4 weeks' },
  { city: 'Shanghai', country: 'China', region: 'East Asia', type: 'modern city/Bund/art/food', flightFromDelhi: '7h', visaForIndians: 'China visa required' },
  { city: 'Hong Kong', country: 'China', region: 'East Asia', type: 'city/harbour/food/hiking', flightFromDelhi: '5h 30min', visaForIndians: 'Visa-free 14 days' },
  { city: 'Chengdu', country: 'China', region: 'East Asia', type: 'panda/Sichuan food/teahouses', flightFromDelhi: '6h', visaForIndians: 'China visa required' },
  { city: "Xi'an", country: 'China', region: 'East Asia', type: 'Terracotta Army/ancient walls/silk road', flightFromDelhi: '5h 30min', visaForIndians: 'China visa required' },
  { city: 'Guilin', country: 'China', region: 'East Asia', type: 'karst mountains/Li River/rice terraces', flightFromDelhi: '7h via Shanghai', visaForIndians: 'China visa required' },
  { city: 'Zhangjiajie', country: 'China', region: 'East Asia', type: 'Avatar mountains/glass bridge', flightFromDelhi: '8h via Shanghai', visaForIndians: 'China visa required' },
  { city: 'Macau', country: 'China', region: 'East Asia', type: 'gambling/Portuguese heritage/food', flightFromDelhi: '5h 30min', visaForIndians: 'Visa-free 30 days' },
  { city: 'Taipei', country: 'Taiwan', region: 'East Asia', type: 'night markets/food/temples/hiking', flightFromDelhi: '6h', visaForIndians: 'e-Visa USD 55 or VOA' },
  // South Asia
  { city: 'Colombo', country: 'Sri Lanka', region: 'South Asia', type: 'capital/colonial/beaches nearby', flightFromDelhi: '3h 30min', visaForIndians: 'e-Visa USD 20, eta.gov.lk' },
  { city: 'Sigiriya', country: 'Sri Lanka', region: 'South Asia', type: 'rock fortress/UNESCO/ancient palace', flightFromDelhi: '3h 30min to Colombo + 4h', visaForIndians: 'e-Visa USD 20' },
  { city: 'Kandy', country: 'Sri Lanka', region: 'South Asia', type: 'Temple of Tooth/tea/cultural', flightFromDelhi: '3h 30min to Colombo + 3h', visaForIndians: 'e-Visa USD 20' },
  { city: 'Galle', country: 'Sri Lanka', region: 'South Asia', type: 'Dutch fort/colonial/beach', flightFromDelhi: '3h 30min to Colombo + 2.5h', visaForIndians: 'e-Visa USD 20' },
  { city: 'Ella', country: 'Sri Lanka', region: 'South Asia', type: 'tea/mountains/train journey/hikes', flightFromDelhi: '3h 30min to Colombo + 6h train', visaForIndians: 'e-Visa USD 20' },
  { city: 'Mirissa', country: 'Sri Lanka', region: 'South Asia', type: 'whale watching/beach/surfing', flightFromDelhi: '3h 30min to Colombo + 3h', visaForIndians: 'e-Visa USD 20' },
  { city: 'Kathmandu', country: 'Nepal', region: 'South Asia', type: 'temples/trekking gateway/culture', flightFromDelhi: '1h 30min', visaForIndians: 'No visa, Aadhaar card' },
  { city: 'Pokhara', country: 'Nepal', region: 'South Asia', type: 'Annapurna/lakeside/paragliding', flightFromDelhi: '1h 30min to KTM + 25min flight', visaForIndians: 'No visa' },
  { city: 'Everest Base Camp', country: 'Nepal', region: 'South Asia', type: 'trek/Himalayas/adventure', flightFromDelhi: '1h 30min to KTM + Lukla flight', visaForIndians: 'No visa + trekking permits' },
  { city: 'Thimphu', country: 'Bhutan', region: 'South Asia', type: 'capital/dzongs/culture/happiness', flightFromDelhi: '2h', visaForIndians: 'No visa, SDF USD 100/day' },
  { city: 'Paro', country: 'Bhutan', region: 'South Asia', type: 'Tiger\'s Nest/gateway/dzong', flightFromDelhi: '2h', visaForIndians: 'No visa, SDF USD 100/day' },
  // Middle East
  { city: 'Abu Dhabi', country: 'UAE', region: 'Middle East', type: 'Sheikh Zayed/F1/culture/Louvre', flightFromDelhi: '3h 30min', visaForIndians: 'Visa-free 30 days' },
  { city: 'Doha', country: 'Qatar', region: 'Middle East', type: 'Museum/Souq Waqif/World Cup', flightFromDelhi: '4h', visaForIndians: 'Visa-free on arrival most Indians' },
  { city: 'Muscat', country: 'Oman', region: 'Middle East', type: 'forts/Sultan/markets/beaches', flightFromDelhi: '4h', visaForIndians: 'e-Visa USD 20' },
  { city: 'Nizwa', country: 'Oman', region: 'Middle East', type: 'fort/souk/date market/frankincense', flightFromDelhi: '4h to Muscat + 1.5h', visaForIndians: 'e-Visa USD 20' },
  { city: 'Petra', country: 'Jordan', region: 'Middle East', type: 'rose city/Nabataean/UNESCO', flightFromDelhi: '6h to Amman + 3h bus', visaForIndians: 'Jordan visa required' },
  { city: 'Amman', country: 'Jordan', region: 'Middle East', type: 'capital/Roman ruins/food', flightFromDelhi: '5h', visaForIndians: 'Jordan visa required' },
  { city: 'Wadi Rum', country: 'Jordan', region: 'Middle East', type: 'desert/camping/Mars landscape', flightFromDelhi: '5h to Amman + 4h', visaForIndians: 'Jordan visa required' },
  { city: 'Istanbul', country: 'Turkey', region: 'Middle East', type: 'Hagia Sophia/bazaar/Bosphorus', flightFromDelhi: '7h', visaForIndians: 'e-Visa USD 50' },
  { city: 'Cappadocia', country: 'Turkey', region: 'Middle East', type: 'hot air balloon/cave hotels/fairy chimneys', flightFromDelhi: '7h to Istanbul + 1.5h', visaForIndians: 'e-Visa USD 50' },
  { city: 'Bodrum', country: 'Turkey', region: 'Middle East', type: 'Aegean coast/yacht/castle/beaches', flightFromDelhi: '7h to Istanbul + 1h', visaForIndians: 'e-Visa USD 50' },
  { city: 'Antalya', country: 'Turkey', region: 'Middle East', type: 'Roman ruins/beaches/old town', flightFromDelhi: '7h', visaForIndians: 'e-Visa USD 50' },
  { city: 'Pamukkale', country: 'Turkey', region: 'Middle East', type: 'cotton castle/travertines/Hierapolis', flightFromDelhi: '7h to Istanbul + 1h + 3h bus', visaForIndians: 'e-Visa USD 50' },
  // Europe — France
  { city: 'Nice', country: 'France', region: 'Europe', type: 'Riviera/beaches/markets', flightFromDelhi: '10h', visaForIndians: 'Schengen EUR 80, VFS 3 weeks' },
  { city: 'Lyon', country: 'France', region: 'Europe', type: 'gastronomy capital/silk/traboules', flightFromDelhi: '10h', visaForIndians: 'Schengen EUR 80' },
  { city: 'Bordeaux', country: 'France', region: 'Europe', type: 'wine/architecture/Garonne', flightFromDelhi: '10h', visaForIndians: 'Schengen EUR 80' },
  { city: 'Chamonix', country: 'France', region: 'Europe', type: 'Mont Blanc/skiing/hiking', flightFromDelhi: '10h to Paris + 5.5h train', visaForIndians: 'Schengen EUR 80' },
  { city: 'Normandy', country: 'France', region: 'Europe', type: 'D-Day/WWII/beaches/Mont Saint-Michel', flightFromDelhi: '10h to Paris + 2.5h', visaForIndians: 'Schengen EUR 80' },
  // Europe — UK
  { city: 'Edinburgh', country: 'UK', region: 'Europe', type: 'castle/Arthur\'s Seat/festival/whisky', flightFromDelhi: '10h to London + 1h 20min', visaForIndians: 'UK visa GBP 115, separate from Schengen' },
  { city: 'Bath', country: 'UK', region: 'Europe', type: 'Roman baths/Georgian/Jane Austen', flightFromDelhi: '10h to London + 1.5h train', visaForIndians: 'UK visa GBP 115' },
  { city: 'Oxford', country: 'UK', region: 'Europe', type: 'university/Bodleian/colleges', flightFromDelhi: '10h to London + 1h train', visaForIndians: 'UK visa GBP 115' },
  { city: 'Lake District', country: 'UK', region: 'Europe', type: 'lakes/fells/Windermere/Beatrix Potter', flightFromDelhi: '10h to London + 3h train', visaForIndians: 'UK visa GBP 115' },
  { city: 'York', country: 'UK', region: 'Europe', type: 'medieval walls/Vikings/Minster', flightFromDelhi: '10h to London + 2h train', visaForIndians: 'UK visa GBP 115' },
  // Europe — Italy
  { city: 'Rome', country: 'Italy', region: 'Europe', type: 'Colosseum/Vatican/eternal city', flightFromDelhi: '9h', visaForIndians: 'Schengen EUR 80' },
  { city: 'Florence', country: 'Italy', region: 'Europe', type: 'Renaissance/Uffizi/Duomo/Chianti', flightFromDelhi: '9h', visaForIndians: 'Schengen EUR 80' },
  { city: 'Venice', country: 'Italy', region: 'Europe', type: 'canals/gondolas/masks/sinking city', flightFromDelhi: '9h', visaForIndians: 'Schengen EUR 80' },
  { city: 'Amalfi Coast', country: 'Italy', region: 'Europe', type: 'cliffside villages/lemon/Positano', flightFromDelhi: '9h to Naples + 1.5h', visaForIndians: 'Schengen EUR 80' },
  { city: 'Milan', country: 'Italy', region: 'Europe', type: 'fashion/Duomo/Da Vinci/aperitivo', flightFromDelhi: '9h', visaForIndians: 'Schengen EUR 80' },
  { city: 'Naples', country: 'Italy', region: 'Europe', type: 'pizza/Pompeii/chaos/street life', flightFromDelhi: '9h', visaForIndians: 'Schengen EUR 80' },
  { city: 'Cinque Terre', country: 'Italy', region: 'Europe', type: 'five villages/hiking/seafood/train', flightFromDelhi: '9h to Milan + 3h train', visaForIndians: 'Schengen EUR 80' },
  { city: 'Tuscany', country: 'Italy', region: 'Europe', type: 'wine/rolling hills/medieval towns', flightFromDelhi: '9h to Florence/Pisa', visaForIndians: 'Schengen EUR 80' },
  { city: 'Sicily', country: 'Italy', region: 'Europe', type: 'Etna/ruins/food/Godfather', flightFromDelhi: '9h to Rome/Milan + 1h', visaForIndians: 'Schengen EUR 80' },
  { city: 'Bologna', country: 'Italy', region: 'Europe', type: 'food capital/porticoes/university', flightFromDelhi: '9h', visaForIndians: 'Schengen EUR 80' },
  // Europe — Spain
  { city: 'Barcelona', country: 'Spain', region: 'Europe', type: 'Gaudi/beaches/tapas/nightlife', flightFromDelhi: '10h', visaForIndians: 'Schengen EUR 80' },
  { city: 'Madrid', country: 'Spain', region: 'Europe', type: 'Prado/Retiro/tapas/flamenco', flightFromDelhi: '10h', visaForIndians: 'Schengen EUR 80' },
  { city: 'Seville', country: 'Spain', region: 'Europe', type: 'flamenco/Alcazar/tapas/Semana Santa', flightFromDelhi: '10h to Madrid + 2.5h AVE', visaForIndians: 'Schengen EUR 80' },
  { city: 'Granada', country: 'Spain', region: 'Europe', type: 'Alhambra/Moorish/tapas free', flightFromDelhi: '10h to Madrid + 4h bus', visaForIndians: 'Schengen EUR 80' },
  { city: 'San Sebastian', country: 'Spain', region: 'Europe', type: 'pintxos/beach/Michelin/Basque', flightFromDelhi: '10h to Madrid + 5h', visaForIndians: 'Schengen EUR 80' },
  { city: 'Valencia', country: 'Spain', region: 'Europe', type: 'paella/City of Arts/beaches', flightFromDelhi: '10h', visaForIndians: 'Schengen EUR 80' },
  // Europe — Germany
  { city: 'Berlin', country: 'Germany', region: 'Europe', type: 'Wall/history/clubbing/art', flightFromDelhi: '9h', visaForIndians: 'Schengen EUR 80' },
  { city: 'Munich', country: 'Germany', region: 'Europe', type: 'Oktoberfest/beer gardens/Marienplatz', flightFromDelhi: '9h', visaForIndians: 'Schengen EUR 80' },
  { city: 'Hamburg', country: 'Germany', region: 'Europe', type: 'port/Speicherstadt/fish market', flightFromDelhi: '9h', visaForIndians: 'Schengen EUR 80' },
  { city: 'Heidelberg', country: 'Germany', region: 'Europe', type: 'castle/old town/university', flightFromDelhi: '9h to Frankfurt + 1h', visaForIndians: 'Schengen EUR 80' },
  { city: 'Rothenburg', country: 'Germany', region: 'Europe', type: 'medieval walled town/Christmas', flightFromDelhi: '9h to Frankfurt + 2.5h', visaForIndians: 'Schengen EUR 80' },
  { city: 'Dresden', country: 'Germany', region: 'Europe', type: 'baroque/rebuilt/Zwinger/Semper', flightFromDelhi: '9h to Berlin + 2h', visaForIndians: 'Schengen EUR 80' },
  // Europe — Austria
  { city: 'Vienna', country: 'Austria', region: 'Europe', type: 'opera/imperial/coffee houses/Mozart', flightFromDelhi: '9h', visaForIndians: 'Schengen EUR 80' },
  { city: 'Salzburg', country: 'Austria', region: 'Europe', type: 'Mozart/Sound of Music/castle', flightFromDelhi: '9h to Vienna + 2.5h', visaForIndians: 'Schengen EUR 80' },
  { city: 'Hallstatt', country: 'Austria', region: 'Europe', type: 'lake/salt mine/UNESCO/Alpine village', flightFromDelhi: '9h to Vienna + 3.5h', visaForIndians: 'Schengen EUR 80' },
  // Europe — Switzerland
  { city: 'Zurich', country: 'Switzerland', region: 'Europe', type: 'finance/lake/museums/shopping', flightFromDelhi: '9h', visaForIndians: 'Schengen EUR 80' },
  { city: 'Lucerne', country: 'Switzerland', region: 'Europe', type: 'lake/Chapel Bridge/Alps/Mt Pilatus', flightFromDelhi: '9h to Zurich + 1h', visaForIndians: 'Schengen EUR 80' },
  { city: 'Interlaken', country: 'Switzerland', region: 'Europe', type: 'Jungfrau/adventure/paragliding', flightFromDelhi: '9h to Zurich + 2h', visaForIndians: 'Schengen EUR 80' },
  { city: 'Zermatt', country: 'Switzerland', region: 'Europe', type: 'Matterhorn/ski/car-free village', flightFromDelhi: '9h to Geneva + 3.5h', visaForIndians: 'Schengen EUR 80' },
  // Europe — Greece
  { city: 'Athens', country: 'Greece', region: 'Europe', type: 'Acropolis/ancient/food/Plaka', flightFromDelhi: '9h', visaForIndians: 'Schengen EUR 80' },
  { city: 'Santorini', country: 'Greece', region: 'Europe', type: 'caldera/white&blue/sunset/wine', flightFromDelhi: '9h to Athens + 45min', visaForIndians: 'Schengen EUR 80' },
  { city: 'Mykonos', country: 'Greece', region: 'Europe', type: 'party/windmills/beaches/gay-friendly', flightFromDelhi: '9h to Athens + 45min', visaForIndians: 'Schengen EUR 80' },
  { city: 'Crete', country: 'Greece', region: 'Europe', type: 'largest island/Minoans/beaches/food', flightFromDelhi: '9h to Athens + 1h', visaForIndians: 'Schengen EUR 80' },
  { city: 'Rhodes', country: 'Greece', region: 'Europe', type: 'medieval Old Town/beaches/UNESCO', flightFromDelhi: '9h to Athens + 1h', visaForIndians: 'Schengen EUR 80' },
  { city: 'Corfu', country: 'Greece', region: 'Europe', type: 'Venetian/beaches/olive groves', flightFromDelhi: '9h to Athens + 1h', visaForIndians: 'Schengen EUR 80' },
  // Europe — Portugal
  { city: 'Lisbon', country: 'Portugal', region: 'Europe', type: 'fado/Alfama/trams/pasteis', flightFromDelhi: '11h', visaForIndians: 'Schengen EUR 80' },
  { city: 'Porto', country: 'Portugal', region: 'Europe', type: 'port wine/Douro/azulejos/bridge', flightFromDelhi: '11h', visaForIndians: 'Schengen EUR 80' },
  { city: 'Algarve', country: 'Portugal', region: 'Europe', type: 'beaches/cliffs/Lagos/Albufeira', flightFromDelhi: '11h to Lisbon + 2.5h', visaForIndians: 'Schengen EUR 80' },
  { city: 'Sintra', country: 'Portugal', region: 'Europe', type: 'fairy-tale palaces/UNESCO/forest', flightFromDelhi: '11h to Lisbon + 40min', visaForIndians: 'Schengen EUR 80' },
  // Europe — Others
  { city: 'Amsterdam', country: 'Netherlands', region: 'Europe', type: 'canals/bicycles/museums/tulips', flightFromDelhi: '9h', visaForIndians: 'Schengen EUR 80' },
  { city: 'Prague', country: 'Czech Republic', region: 'Europe', type: 'old town/castle/beer/Kafka', flightFromDelhi: '9h', visaForIndians: 'Schengen EUR 80' },
  { city: 'Budapest', country: 'Hungary', region: 'Europe', type: 'thermal baths/Parliament/ruin bars', flightFromDelhi: '9h', visaForIndians: 'Schengen EUR 80' },
  { city: 'Dubrovnik', country: 'Croatia', region: 'Europe', type: 'Game of Thrones/walls/Adriatic', flightFromDelhi: '9h', visaForIndians: 'Schengen EUR 80' },
  { city: 'Split', country: 'Croatia', region: 'Europe', type: 'Diocletian/islands/Dalmatian coast', flightFromDelhi: '9h', visaForIndians: 'Schengen EUR 80' },
  { city: 'Copenhagen', country: 'Denmark', region: 'Europe', type: 'Nyhavn/cycling/Noma/hygge', flightFromDelhi: '9h', visaForIndians: 'Schengen EUR 80' },
  { city: 'Stockholm', country: 'Sweden', region: 'Europe', type: 'archipelago/ABBA/IKEA/Gamla Stan', flightFromDelhi: '9h', visaForIndians: 'Schengen EUR 80' },
  { city: 'Oslo', country: 'Norway', region: 'Europe', type: 'fjords gateway/Vikings/Northern Lights', flightFromDelhi: '9h', visaForIndians: 'Schengen EUR 80' },
  { city: 'Bergen', country: 'Norway', region: 'Europe', type: 'fjords/Bryggen/fish market', flightFromDelhi: '9h to Oslo + 1h', visaForIndians: 'Schengen EUR 80' },
  { city: 'Reykjavik', country: 'Iceland', region: 'Europe', type: 'Northern Lights/geysers/hot springs', flightFromDelhi: '14h via London/Amsterdam', visaForIndians: 'Schengen EUR 80' },
  { city: 'Brussels', country: 'Belgium', region: 'Europe', type: 'waffles/beer/EU/Grand Place', flightFromDelhi: '9h', visaForIndians: 'Schengen EUR 80' },
  { city: 'Bruges', country: 'Belgium', region: 'Europe', type: 'medieval canals/chocolate/beer', flightFromDelhi: '9h to Brussels + 1h', visaForIndians: 'Schengen EUR 80' },
  { city: 'Warsaw', country: 'Poland', region: 'Europe', type: 'WWII/Old Town rebuilt/vodka/pierogis', flightFromDelhi: '9h', visaForIndians: 'Schengen EUR 80' },
  { city: 'Krakow', country: 'Poland', region: 'Europe', type: 'Auschwitz/Wawel/Jewish quarter/vodka', flightFromDelhi: '9h', visaForIndians: 'Schengen EUR 80' },
  { city: 'Tbilisi', country: 'Georgia', region: 'Europe', type: 'wine/sulfur baths/churches/chacha', flightFromDelhi: '5h', visaForIndians: 'Visa-free 1 year' },
  // Africa
  { city: 'Cairo', country: 'Egypt', region: 'Africa', type: 'Pyramids/Sphinx/Khan el-Khalili/Nile', flightFromDelhi: '6h', visaForIndians: 'e-Visa USD 25' },
  { city: 'Luxor', country: 'Egypt', region: 'Africa', type: 'Valley of Kings/Karnak/open air museum', flightFromDelhi: '6h to Cairo + 1h', visaForIndians: 'e-Visa USD 25' },
  { city: 'Aswan', country: 'Egypt', region: 'Africa', type: 'Nile/Abu Simbel/Nubian culture', flightFromDelhi: '6h to Cairo + 1.5h', visaForIndians: 'e-Visa USD 25' },
  { city: 'Marrakech', country: 'Morocco', region: 'Africa', type: 'souks/Jemaa el-Fna/riads/spices', flightFromDelhi: '10h', visaForIndians: 'Visa-free 90 days' },
  { city: 'Fez', country: 'Morocco', region: 'Africa', type: 'medina/tanneries/Islamic learning', flightFromDelhi: '10h to Casablanca + 3h', visaForIndians: 'Visa-free 90 days' },
  { city: 'Chefchaouen', country: 'Morocco', region: 'Africa', type: 'blue city/hiking/cannabis', flightFromDelhi: '10h to Tangier + 3h bus', visaForIndians: 'Visa-free 90 days' },
  { city: 'Cape Town', country: 'South Africa', region: 'Africa', type: 'Table Mountain/wine/beaches/Cape', flightFromDelhi: '11h', visaForIndians: 'SA visa required, VFS' },
  { city: 'Zanzibar', country: 'Tanzania', region: 'Africa', type: 'spice/Stone Town/beaches/diving', flightFromDelhi: '9h via Nairobi', visaForIndians: 'e-Visa USD 50' },
  { city: 'Serengeti', country: 'Tanzania', region: 'Africa', type: 'Great Migration/Big Five/safari', flightFromDelhi: '9h to Nairobi + 1h flight', visaForIndians: 'e-Visa USD 50' },
  { city: 'Masai Mara', country: 'Kenya', region: 'Africa', type: 'Great Migration/safari/Maasai', flightFromDelhi: '8h to Nairobi + 45min', visaForIndians: 'e-Visa USD 51' },
  { city: 'Mauritius', country: 'Mauritius', region: 'Africa', type: 'beach/snorkeling/luxury/multicultural', flightFromDelhi: '6h', visaForIndians: 'Visa-free 90 days' },
  // Americas
  { city: 'New York', country: 'USA', region: 'Americas', type: 'Times Square/Central Park/art/food', flightFromDelhi: '14h', visaForIndians: 'US B-2 visa USD 185, interview' },
  { city: 'Los Angeles', country: 'USA', region: 'Americas', type: 'Hollywood/beaches/Getty/food', flightFromDelhi: '17h via Frankfurt', visaForIndians: 'US B-2 visa' },
  { city: 'San Francisco', country: 'USA', region: 'Americas', type: 'Golden Gate/tech/food/fog', flightFromDelhi: '16h', visaForIndians: 'US B-2 visa' },
  { city: 'Chicago', country: 'USA', region: 'Americas', type: 'architecture/food/jazz/Millennium Park', flightFromDelhi: '15h', visaForIndians: 'US B-2 visa' },
  { city: 'Miami', country: 'USA', region: 'Americas', type: 'South Beach/Art Deco/nightlife/Cuban', flightFromDelhi: '16h', visaForIndians: 'US B-2 visa' },
  { city: 'New Orleans', country: 'USA', region: 'Americas', type: 'jazz/Mardi Gras/Creole food/haunted', flightFromDelhi: '18h via Houston', visaForIndians: 'US B-2 visa' },
  { city: 'Las Vegas', country: 'USA', region: 'Americas', type: 'casinos/shows/Grand Canyon/food', flightFromDelhi: '17h', visaForIndians: 'US B-2 visa' },
  { city: 'Hawaii', country: 'USA', region: 'Americas', type: 'volcanoes/beaches/surfing/aloha', flightFromDelhi: '20h', visaForIndians: 'US B-2 visa' },
  { city: 'Vancouver', country: 'Canada', region: 'Americas', type: 'mountains/ocean/multicultural/film', flightFromDelhi: '15h', visaForIndians: 'Canada visa required' },
  { city: 'Toronto', country: 'Canada', region: 'Americas', type: 'CN Tower/multicultural/Niagara/food', flightFromDelhi: '14h', visaForIndians: 'Canada visa required' },
  { city: 'Banff', country: 'Canada', region: 'Americas', type: 'Rockies/Lake Louise/ski/wildlife', flightFromDelhi: '14h to Calgary + 1.5h', visaForIndians: 'Canada visa required' },
  { city: 'Mexico City', country: 'Mexico', region: 'Americas', type: 'Aztec/food/art/Frida Kahlo', flightFromDelhi: '18h via London', visaForIndians: 'Visa-free with valid US/EU visa' },
  { city: 'Cancun', country: 'Mexico', region: 'Americas', type: 'beach/Chichen Itza/cenotes/nightlife', flightFromDelhi: '18h', visaForIndians: 'Visa-free with valid US/EU visa' },
  { city: 'Tulum', country: 'Mexico', region: 'Americas', type: 'Mayan ruins/cenotes/eco-luxury/beach', flightFromDelhi: '18h to Cancun + 2h', visaForIndians: 'Visa-free with valid US/EU visa' },
  { city: 'Oaxaca', country: 'Mexico', region: 'Americas', type: 'mole/mezcal/Day of Dead/zapotec', flightFromDelhi: '18h to Mexico City + 1h', visaForIndians: 'Visa-free with valid US/EU visa' },
  { city: 'Cartagena', country: 'Colombia', region: 'Americas', type: 'colonial walled city/beaches/Caribbean', flightFromDelhi: '18h via Madrid', visaForIndians: 'Visa-free 90 days' },
  { city: 'Medellin', country: 'Colombia', region: 'Americas', type: 'cable cars/Pablo Escobar/eternal spring', flightFromDelhi: '18h via Madrid', visaForIndians: 'Visa-free 90 days' },
  { city: 'Machu Picchu', country: 'Peru', region: 'Americas', type: 'Inca/UNESCO/sacred valley/clouds', flightFromDelhi: '20h via Madrid', visaForIndians: 'Visa-free 90 days' },
  { city: 'Rio de Janeiro', country: 'Brazil', region: 'Americas', type: 'carnival/Christ/beaches/samba', flightFromDelhi: '18h via Doha/Dubai', visaForIndians: 'Visa-free 90 days' },
  { city: 'Buenos Aires', country: 'Argentina', region: 'Americas', type: 'tango/steak/Paris of South America', flightFromDelhi: '20h', visaForIndians: 'Visa-free 90 days' },
  { city: 'Atacama Desert', country: 'Chile', region: 'Americas', type: 'driest desert/stargazing/geysers', flightFromDelhi: '22h via Madrid', visaForIndians: 'Visa-free 90 days' },
  // Oceania
  { city: 'Sydney', country: 'Australia', region: 'Oceania', type: 'Opera House/harbour/beaches/food', flightFromDelhi: '13h', visaForIndians: 'Australia e-Visa AUD 20' },
  { city: 'Melbourne', country: 'Australia', region: 'Oceania', type: 'coffee/art/food/sports/laneways', flightFromDelhi: '13h', visaForIndians: 'Australia e-Visa AUD 20' },
  { city: 'Gold Coast', country: 'Australia', region: 'Oceania', type: 'theme parks/beaches/surfing', flightFromDelhi: '12h', visaForIndians: 'Australia e-Visa' },
  { city: 'Cairns', country: 'Australia', region: 'Oceania', type: 'Great Barrier Reef/rainforest/diving', flightFromDelhi: '12h', visaForIndians: 'Australia e-Visa' },
  { city: 'Uluru', country: 'Australia', region: 'Oceania', type: 'sacred rock/Aboriginal/outback/stars', flightFromDelhi: '12h to Sydney + 3h', visaForIndians: 'Australia e-Visa' },
  { city: 'Auckland', country: 'New Zealand', region: 'Oceania', type: 'harbour/Sky Tower/volcanoes', flightFromDelhi: '14h', visaForIndians: 'NZ ETA NZD 23' },
  { city: 'Queenstown', country: 'New Zealand', region: 'Oceania', type: 'adventure capital/bungee/fjords/skiing', flightFromDelhi: '14h to Auckland + 2h', visaForIndians: 'NZ ETA NZD 23' },
  { city: 'Milford Sound', country: 'New Zealand', region: 'Oceania', type: 'fjord/waterfalls/UNESCO/kayak', flightFromDelhi: '14h to Auckland + 2h + 4h', visaForIndians: 'NZ ETA NZD 23' },
  // Islands
  { city: 'Fiji', country: 'Fiji', region: 'Pacific', type: 'beach/coral/bure/kava/overwater', flightFromDelhi: '16h via Singapore', visaForIndians: 'Visa-free 4 months' },
  { city: 'Bora Bora', country: 'French Polynesia', region: 'Pacific', type: 'overwater bungalows/lagoon/luxury', flightFromDelhi: '20h via Los Angeles', visaForIndians: 'Visa-free with French visa/EU visa' },
];

// ── Prompt builder ──
function buildIntlPrompt(city, country, region, type, flightFromDelhi, visaForIndians) {
  return `You are the world's best travel writer creating destination intelligence for SKYmora Travels.
Primary audience: Indian travelers (from Delhi, Mumbai, Bangalore).

Create a DEEP, SPECIFIC JSON knowledge file for ${city}, ${country} (${type}).

Key logistics:
- Flight from Delhi: ${flightFromDelhi}
- Visa for Indians: ${visaForIndians}
- Region: ${region}

BANNED PHRASES — response fails if any of these appear:
"hidden gem", "nestled", "vibrant", "bustling", "charming", "unforgettable", "stunning",
"breathtaking", "world-class", "must-visit", "unique blend", "waiting to be discovered",
"rich culture", "warm hospitality", "truly special", "off the beaten path"

Return ONLY valid JSON:

{
  "destination": "${city}",
  "country": "${country}",
  "region": "${region}",
  "aliases": ["${city}", "${city.toLowerCase()}", "${country.toLowerCase()}"],
  "lastUpdated": "2026-06",
  "_schemaVersion": "3.0-intl",

  "meta": { "dataQualityScore": 9.2, "bestFor": ["5 traveler types"], "notFor": ["3 traveler types"] },

  "hardFacts": {
    "flightFromDelhi": "${flightFromDelhi}",
    "flightFromMumbai": "[specific time and airlines]",
    "visaForIndians": "${visaForIndians}",
    "currency": "[local currency and 1 INR = X]",
    "timezone": "[UTC offset]",
    "language": "[working language for tourists]",
    "bestMonthToVisit": "[specific month + reason]",
    "avoidMonth": "[specific month + reason]",
    "tipping": "[local tipping culture + amounts]"
  },

  "whyPeopleFallInLove": "[2-3 sentences. Specific moment, smell, or experience — not 'beautiful city'. Should make someone want to book a ticket right now.]",

  "honestTruth": "[ONE sentence that most travel guides miss. Something slightly uncomfortable or surprising that makes SKYmora sound like a local insider.]",

  "localTruths": [
    "Most visitors think [X]. Locals think [Y — specific contrast].",
    "Most visitors [do Z]. The best version of ${city} is [the real alternative].",
    "Most visitors miss [specific thing]. The real ${city} starts at [specific place/time]."
  ],

  "neighborhoodPersonalities": {
    "[area name]": { "tags": ["tag1","tag2","tag3"], "bestFor": "one sentence", "avoid": "one honest caveat" }
  },

  "gettingHere": {
    "fromDelhi": {
      "flight": { "duration": "${flightFromDelhi}", "airlines": ["airline1","airline2"], "priceRange": "[INR range economy return]", "note": "[booking tip]" }
    },
    "fromMumbai": {
      "flight": { "duration": "[time]", "airlines": ["airlines"], "priceRange": "[INR range]" }
    },
    "airportToCity": {
      "metro": "[if exists, cost and time]",
      "taxi": "[cost and time]",
      "recommended": "[what SKYmora recommends for first-timers]"
    }
  },

  "visaIntelligence": {
    "indianPassport": "${visaForIndians}",
    "applyAt": "[specific website or VFS location]",
    "processingTime": "[typical days]",
    "tip": "[one specific insider visa tip]"
  },

  "whyPeopleFallInLove": "[already defined above]",

  "localTruths": [],

  "ifYouOnlyHadOneChance": {
    "breakfast": "[specific café/spot + what to order]",
    "sunset": "[specific location + exact timing]",
    "meal": "[specific restaurant + specific dish]",
    "memory": "[the one moment that defines this city]",
    "secret": "[what only locals know]"
  },

  "neighborhoodPersonalities": {},

  "residentSunday": "[What a ${city} resident does with one free Sunday. Specific places, times, food. Real names. No generic activities.]",

  "dayMemoryTargets": {
    "arrival": "[The one specific moment on arrival day they remember in 5 years — not the attraction, the MOMENT]",
    "peak": "[The peak day memory target — specific and earned]",
    "departure": "[How the departure should feel]"
  },

  "tripLengthGuide": {
    "two_days": { "focus": "[what this covers]", "misses": "[what you miss]" },
    "three_to_four_days": { "focus": "[sweet spot coverage]", "sweetSpot": true },
    "five_to_seven_days": { "focus": "[deeper exploration]", "whoFor": "[traveler type]" },
    "recommended": "[X days — one sentence why]"
  },

  "antiPatterns": [
    "[Specific bad combination #1 + why it fails]",
    "[Specific bad combination #2 + why it fails]",
    "[Timing/sequence mistake that ruins the experience]"
  ],

  "commonRegrets": [
    "Most visitors regret [specific mistake #1]",
    "Most visitors regret [specific mistake #2]",
    "Most visitors regret [specific mistake #3]"
  ],

  "seasonalIntelligence": {
    "peakSeason": { "months": "[list]", "weather": "[temp/conditions]", "crowds": "[honest]", "verdict": "[one honest verdict]" },
    "shoulderSeason": { "months": "[list]", "why": "[why better for most travelers]" },
    "offSeason": { "months": "[list]", "reality": "[honest — monsoon/cold/etc]", "hiddenGem": "[one reason some prefer it]" },
    "bestMonth": "[specific month + reason]",
    "currentSeason": "[June 2026 conditions in ${city}]"
  },

  "insiderIntelligence": [
    { "tip": "[verbatim specific insider tip — real place, real price, real time]", "category": "food/transport/timing/experience" },
    { "tip": "[tip 2]", "category": "" },
    { "tip": "[tip 3]", "category": "" },
    { "tip": "[tip 4]", "category": "" },
    { "tip": "[tip 5]", "category": "" }
  ],

  "pricingBenchmarks": {
    "budgetMeal": "[specific dish at specific type of place + cost in local currency + INR equivalent]",
    "midRangeMeal": "[specific meal type + cost]",
    "luxuryMeal": "[specific restaurant tier + cost]",
    "localTransportPerDay": "[typical daily local transport cost]",
    "budgetHotelPerNight": "[cost + what you get]",
    "midRangeHotelPerNight": "[cost + what you get]",
    "luxuryHotelPerNight": "[cost]"
  },

  "budgetReality": {
    "backpacker": { "perDayINR": "[₹X,XXX]", "accommodation": "[type + cost]", "food": "[approach]", "transport": "[approach]" },
    "comfortable": { "perDayINR": "[₹XX,XXX]", "accommodation": "[type + cost]", "food": "[approach]" },
    "luxury": { "perDayINR": "[₹XXX,XXX+]", "note": "[honest note about luxury in this destination]" }
  },

  "culturalRules": [
    "[specific rule 1 for tourists — dress/behavior/etiquette]",
    "[specific rule 2]",
    "[specific rule 3]"
  ],

  "safetyIntelligence": {
    "overallRating": "[Safe/Generally Safe/Exercise Caution]",
    "scamsToKnow": ["[specific scam #1 + prevention]", "[specific scam #2]"],
    "emergencyContacts": { "police": "[number]", "ambulance": "[number]", "indianEmbassy": "[number or address]" }
  },

  "photographyIntelligence": {
    "bestShotLocations": [
      { "name": "[location]", "what": "[what to photograph]", "bestTime": "[specific time]", "tip": "[insider tip]" }
    ],
    "goldenHour": "[timing for this city/season]",
    "tip": "[one photography insight specific to ${city}]"
  },

  "combinationIntelligence": [
    {
      "sequence": ["[activity 1]", "[activity 2]", "[activity 3]"],
      "emotionalArc": "[why this sequence creates a better day than alternatives]",
      "bestFor": ["[traveler types]"]
    }
  ],

  "nearbyDestinations": [
    { "city": "[nearby city]", "travelTime": "[hours]", "how": "[transport]", "whyCombine": "[specific reason]" }
  ],

  "accessibility": {
    "wheelchairFriendly": "[honest assessment]",
    "majorChallenges": "[specific challenges]",
    "seniorFriendlyScore": 7,
    "note": "[specific note for travelers with mobility needs]"
  },

  "liveIntelligence": {
    "lastChecked": "2026-06",
    "seasonalNow": "[What June 2026 is actually like in ${city} — weather, crowds, events]",
    "currentAlerts": [],
    "entryRequirements": "[current visa/entry rules as of 2026]"
  }
}

QUALITY STANDARDS:
- Every field must be specific to ${city}. Generic fails.
- pricingBenchmarks must have REAL local currency amounts + INR equivalent
- insiderIntelligence must sound like someone who lived there for a year
- whyPeopleFallInLove must reference a specific moment, not a general vibe
- honestTruth should be something most travel writers don't say`;
}

// ── Generator ──
async function generateCityFile(cityData) {
  const { city, country, region, type, flightFromDelhi, visaForIndians } = cityData;
  const filename = city.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '') + '.json';
  const filepath = path.join(DEST_DIR, filename);

  if (fs.existsSync(filepath)) {
    const existing = JSON.parse(fs.readFileSync(filepath, 'utf8'));
    if (existing._schemaVersion === '3.0-intl' || existing._schemaVersion === '3.0') {
      console.log(`⏭️  Skipping ${city} — already built`);
      return { city, success: true, skipped: true };
    }
  }

  console.log(`🌍 Building: ${city}, ${country} (${region})...`);

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      response_format: { type: "json_object" },
      temperature: 0.7,
      max_tokens: 3500,
      messages: [
        {
          role: "system",
          content: `You are the world's best travel intelligence writer for SKYmora. Primary audience: Indian travelers. Write specific, honest, and detailed. Never generic. Never use banned phrases. Return only valid JSON with all fields filled.`
        },
        { role: "user", content: buildIntlPrompt(city, country, region, type, flightFromDelhi, visaForIndians) }
      ]
    });

    const raw = completion.choices[0]?.message?.content;
    if (!raw) throw new Error("No response");

    // Clean and parse
    const cleaned = raw.replace(/,\s*}/g, '}').replace(/,\s*]/g, ']');
    let data;
    try {
      data = JSON.parse(cleaned);
    } catch {
      const start = cleaned.indexOf('{');
      const end = cleaned.lastIndexOf('}');
      data = JSON.parse(cleaned.slice(start, end + 1));
    }

    data.destination = data.destination || city;
    data.country = data.country || country;
    data._schemaVersion = "3.0-intl";
    data.lastUpdated = "2026-06";

    fs.writeFileSync(filepath, JSON.stringify(data, null, 2));
    console.log(`✅ ${city}, ${country}`);
    return { city, success: true };

  } catch (err) {
    console.error(`❌ ${city} failed:`, err.message.slice(0, 80));
    return { city, success: false, error: err.message };
  }
}

// ── Run ──
const args = process.argv.slice(2);
const target = args[0]?.toLowerCase();

if (!target) {
  console.log('Usage: node build-international-knowledge.js <city>  OR  all');
  console.log(`Total cities: ${INTL_CITIES.length}`);
  INTL_CITIES.forEach(c => console.log(`  - ${c.city}, ${c.country}`));
  process.exit(0);
}

if (target === 'all') {
  console.log(`🚀 Building ${INTL_CITIES.length} international cities...\n`);
  const batchSize = 5;
  const results = [];
  for (let i = 0; i < INTL_CITIES.length; i += batchSize) {
    const batch = INTL_CITIES.slice(i, i + batchSize);
    const batchResults = await Promise.all(batch.map(c => generateCityFile(c)));
    results.push(...batchResults);
    if (i + batchSize < INTL_CITIES.length) await new Promise(r => setTimeout(r, 1500));
  }
  const success = results.filter(r => r?.success && !r?.skipped).length;
  const skipped = results.filter(r => r?.skipped).length;
  const failed = results.filter(r => r && !r.success);
  console.log(`\n✅ Built: ${success} | Skipped: ${skipped} | Failed: ${failed.length}`);
  if (failed.length > 0) console.log('Failed:', failed.map(f => f.city).join(', '));
} else {
  const cityData = INTL_CITIES.find(c => c.city.toLowerCase().includes(target) || target.includes(c.city.toLowerCase().split(' ')[0]));
  if (!cityData) { console.log(`"${target}" not found`); process.exit(1); }
  await generateCityFile(cityData);
}
