// ===============================
// SKYmora LiveSearch Engine v3 🌍
// ===============================
// Real-time Google + DuckDuckGo Hybrid Search
// with smart caching (6h) + premium human summaries
// ===============================

import fetch from "node-fetch";
import OpenAI from "openai";
import fs from "fs";
import path from "path";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const SERPER_KEY = process.env.SERPER_API_KEY || null;
const CACHE_DIR = path.join(process.cwd(), "data");
const CACHE_FILE = path.join(CACHE_DIR, "live-cache.json");
const CACHE_TTL = 6 * 60 * 60 * 1000; // 6 hours

// ===============================
// 🧠 Ensure cache directory + file exist
// ===============================
if (!fs.existsSync(CACHE_DIR)) {
  fs.mkdirSync(CACHE_DIR, { recursive: true });
}

if (!fs.existsSync(CACHE_FILE)) {
  fs.writeFileSync(CACHE_FILE, JSON.stringify({ cache: [] }, null, 2));
}

// Prevent corrupted JSON crash
function loadCache() {
  try {
    const raw = fs.readFileSync(CACHE_FILE, "utf8");
    const json = JSON.parse(raw);
    return Array.isArray(json.cache) ? json.cache : [];
  } catch (err) {
    console.warn("⚠️ LiveSearch: Cache file corrupted. Resetting...");
    fs.writeFileSync(CACHE_FILE, JSON.stringify({ cache: [] }, null, 2));
    return [];
  }
}

function saveCache(cache) {
  fs.writeFileSync(CACHE_FILE, JSON.stringify({ cache }, null, 2));
}

function findCachedResult(query) {
  if (!query) return null;

  const cache = loadCache();

  const entry = cache.find((c) => {
    if (!c.query || !c.timestamp) return false;
    return (
      c.query.toLowerCase() === query.toLowerCase() &&
      Date.now() - new Date(c.timestamp).getTime() < CACHE_TTL
    );
  });

  return entry ? entry.result : null;
}

function updateCache(query, result) {
  const cache = loadCache().filter(
    (c) =>
      c.timestamp &&
      Date.now() - new Date(c.timestamp).getTime() < CACHE_TTL
  );

  cache.unshift({
    query,
    result,
    timestamp: new Date().toISOString(),
  });

  saveCache(cache);
}

// ===============================
// 🔍 Search Trigger Logic
// ===============================
export function needsLiveSearch(message = "") {
  if (!message || typeof message !== "string") return false;

  const msg = message.toLowerCase().trim();
  if (msg.length < 3) return false;

  const intentWords =
    /\b(weather|temperature|forecast|time in|now in|current time|currency|exchange|convert|rate|visa|hotel|flight|price|cost|open now|entry fee|news|event|tourism)\b/;

  const actionOrQuestion =
    /\b(find|show|search|find me|what|where|how|is|are|when|check|rate|best|cheapest|price|convert|today|tomorrow)\b/;

  if (intentWords.test(msg) && actionOrQuestion.test(msg)) return true;

  // Currency format: "100 usd to inr"
  if (/^\d+(\.\d+)?\s*[a-z]{3}\s*(to|-|in)\s*[a-z]{3}$/i.test(msg)) return true;

  return false;
}

// ===============================
// 🌐 Perform Live Search
// ===============================
export async function performLiveSearch(query) {
  console.log(`🌍 [LiveSearch] Searching: ${query}`);

  const cleanedQuery = String(query || "").trim();
  if (!cleanedQuery) return "No query provided.";

  // ----------------------------
  // ⚡ Cache First
  // ----------------------------
  const cached = findCachedResult(cleanedQuery);
  if (cached) {
    console.log("⚡ Using cached live data");
    return `${cached}\n\n(Updated every 6 hours)`;
  }

  async function summarizeWithOpenAI(text, sourceHint = "web") {
    if (!text || text.trim().length < 15) return null;

    try {
      const completion = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        temperature: 0.35,
        max_tokens: 300,
        messages: [
          {
            role: "system",
            content:
              "You are Olivia Chen from SKYmora — a premium travel consultant. Summarize these live results factually in 2–3 sentences with a warm tone, include key numbers or rates, and mention the most relevant source.",
          },
          {
            role: "user",
            content: `Summarize this (source: ${sourceHint}):\n\n${text}`,
          },
        ],
      });

      return completion.choices?.[0]?.message?.content?.trim() || null;
    } catch (err) {
      console.warn("⚠️ OpenAI summary failed:", err.message);
      return null;
    }
  }

  // ===============================
  // 🔎 1) SERPER (Google-powered)
  // ===============================
  try {
    if (SERPER_KEY) {
      const res = await fetch("https://google.serper.dev/search", {
        method: "POST",
        headers: {
          "X-API-KEY": SERPER_KEY,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ q: cleanedQuery }),
      });

      // Handle non-JSON responses safely
      let data;
      try {
        data = await res.json();
      } catch (jsonErr) {
        console.warn("⚠️ Serper: invalid JSON response");
        data = null;
      }

      if (data && Array.isArray(data?.organic)) {
        const results = data.organic.slice(0, 5);

        const meaningful = results
          .map(
            (r, i) =>
              `${i + 1}. ${r.title || ""}\n${r.snippet || ""}\nSource: ${
                r.link || ""
              }`
          )
          .join("\n\n");

        if (meaningful.trim().length > 30) {
          const summary = await summarizeWithOpenAI(
            meaningful,
            "Google (Serper)"
          );
          if (summary) {
            updateCache(cleanedQuery, summary);
            console.log("✅ Live data from Serper cached");
            return `${summary}\n\n(Source: Google search — refreshed every 6 hours.)`;
          }
        }
      }
    }
  } catch (err) {
    console.warn("⚠️ Serper failed:", err.message);
  }

  // ===============================
  // 🦆 2) DUCKDUCKGO fallback
  // ===============================
  try {
    const res = await fetch(
      `https://api.duckduckgo.com/?q=${encodeURIComponent(
        cleanedQuery
      )}&format=json&no_html=1&skip_disambig=1`
    );

    let data;
    try {
      data = await res.json();
    } catch (jsonErr) {
      console.warn("⚠️ DuckDuckGo: invalid JSON");
      data = null;
    }

    if (!data) {
      return "I couldn't fetch reliable information right now. Try rephrasing your query.";
    }

    const topics = Array.isArray(data.RelatedTopics)
      ? data.RelatedTopics.slice(0, 6)
      : [];

    const combined = topics
      .map((t) => (t?.Text ? t.Text : ""))
      .filter(Boolean)
      .join("\n\n");

    if (combined.trim().length > 20) {
      const summary = await summarizeWithOpenAI(
        combined,
        "DuckDuckGo"
      );
      if (summary) {
        updateCache(cleanedQuery, summary);
        console.log("✅ Fallback (DuckDuckGo) live data cached");
        return `${summary}\n\n(Source: DuckDuckGo — refreshed every 6 hours.)`;
      }
    }

    return "I didn't find trustworthy live results — try rephrasing (e.g. 'convert 1 USD to INR' or 'weather in Paris today').";
  } catch (err) {
    console.error("❌ LiveSearch Error:", err.message);
    return "I'm unable to fetch that information right now — an error occurred while searching. Please try again.";
  }
}
