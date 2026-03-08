// ===============================
// SKYmora MASTER INTELLIGENCE COORDINATOR
// 100/100 - ChatGPT/Claude Level
// Perfect Query Routing + Web Search Integration
// ===============================

import { performLiveSearch } from "./skymora-live-search.js";
import { handleIntelligentChat, detectIntent, handleIntentResponse, checkBudgetFeasibility } from "./skymora-smart-chat.js";
import { handleUltraChat } from "./skymora-ultra-chat.js";
import { handlePerfectChat } from "./skymora-perfect-chat.js";
import OpenAI from "openai";
import dotenv from "dotenv";

dotenv.config();
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// ===============================
// QUERY ANALYZER
// Determines what type of query this is
// ===============================

class QueryAnalyzer {
  analyze(message, tripData, conversationHistory) {
    const msg = message.toLowerCase();
    
    return {
      // 1. Does it need live web search?
      needsWebSearch: this.checkWebSearchNeeded(msg),
      
      // 2. Does it need real-time data (date/time)?
      needsRealTime: this.checkRealTimeNeeded(msg),
      
      // 3. What type of query is it?
      queryType: this.detectQueryType(msg, conversationHistory),
      
      // 4. Which brain should handle it?
      suggestedBrain: this.suggestBrain(msg, tripData, conversationHistory),
      
      // 5. How brief should the answer be?
      briefnessLevel: this.assessBriefness(msg),
      
      // 6. Does it modify the trip?
      isModification: this.checkIfModification(msg)
    };
  }

  checkWebSearchNeeded(msg) {
    // ONLY for these specific patterns
    const webSearchPatterns = [
      /price.*(?:today|now|current)|current.*price/i,
      /weather.*(?:today|now|forecast)|today.*weather/i,
      /hotel.*(?:price|available|availability)/i,
      /flight.*(?:price|cost).*\d{4}/i, // "flight price to Dubai 2025"
      /news.*(?:in|about)|recent.*event|happening.*in/i,
      /exchange.*rate|currency.*conversion/i,
      /open.*hours|opening.*time.*today/i,
      /reviews.*(?:today|recent)|latest.*review/i
    ];

    return webSearchPatterns.some(pattern => pattern.test(msg));
  }

  checkRealTimeNeeded(msg) {
    // Date/time queries - no web search needed, just calculation
    return /what.*(?:time|date)|current.*(?:time|date)|today.*date|time.*in|date.*in/i.test(msg);
  }

  detectQueryType(msg, history) {
    // Classify the query
    if (/how much|price|cost|budget|afford/i.test(msg)) return "budget_related";
    if (/visa|passport|document|entry.*requirement/i.test(msg)) return "visa_info";
    if (/pack|bring|luggage|what.*need/i.test(msg)) return "packing_advice";
    if (/culture|etiquette|custom|behavior/i.test(msg)) return "cultural_guidance";
    if (/never|don't|stop/i.test(msg)) return "user_correction";
    if (/remember|recall|mentioned|said/i.test(msg)) return "memory_query";
    if (/change|modify|extend|reduce|different/i.test(msg)) return "trip_modification";
    if (/flight|hotel|restaurant|attraction/i.test(msg)) return "travel_planning";
    if (/thank|thanks|appreciate/i.test(msg)) return "gratitude";
    if (/^(yes|no|ok|sure|fine)$/i.test(msg.trim())) return "simple_confirmation";
    
    return "general_conversation";
  }

  suggestBrain(msg, tripData, history) {
    const type = this.detectQueryType(msg, history);
    
    // Ultra Brain: For factual, brief, real-time queries
    if (type === "simple_confirmation" || 
        type === "user_correction" ||
        type === "memory_query" ||
        msg.length < 30) {
      return "ultra";
    }

    // Smart Brain: For complex travel planning
    if (type === "budget_related" ||
        type === "visa_info" ||
        type === "travel_planning" ||
        type === "trip_modification") {
      return "smart";
    }

    // Perfect Brain: For emotional, conversational queries
    if (type === "gratitude" ||
        type === "cultural_guidance" ||
        type === "general_conversation") {
      return "perfect";
    }

    // Default to Smart for unknown
    return "smart";
  }

  assessBriefness(msg) {
    // How brief should the response be?
    if (/^(what|when|where|who|which)\s+\w+$/i.test(msg)) return "very_brief"; // 1 sentence
    if (msg.length < 20) return "brief"; // 2-3 sentences
    if (/explain|tell me about|how does|why/i.test(msg)) return "detailed"; // 4-6 sentences
    return "normal"; // 3-4 sentences
  }

  checkIfModification(msg) {
    return /change|modify|extend|reduce|add|remove|switch|different/i.test(msg);
  }
}

const analyzer = new QueryAnalyzer();

// ===============================
// MASTER COORDINATOR
// Routes queries intelligently
// ===============================

export async function masterCoordinator(req, res) {
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");

  const { message, tripData = {}, conversationHistory = [] } = req.body;
  const tripId = tripData?.tripId || "default";

  if (!message?.trim()) {
    res.write(`data: ${JSON.stringify({ error: "No message" })}\n\n`);
    return res.end();
  }

  try {
    console.log(`\n🧠 SKYmora Master Coordinator Processing: "${message}"`);

    // ===== STEP 1: ANALYZE QUERY =====
    const analysis = analyzer.analyze(message, tripData, conversationHistory);
    console.log(`📊 Analysis:`, {
      webSearch: analysis.needsWebSearch,
      realTime: analysis.needsRealTime,
      type: analysis.queryType,
      brain: analysis.suggestedBrain,
      briefness: analysis.briefnessLevel
    });

    // ===== STEP 2: BUDGET FEASIBILITY CHECK (If relevant) =====
    if (analysis.queryType === "budget_related" && tripData.budget && tripData.tripDays) {
      const numericBudget = Number(String(tripData.budget).replace(/[^\d]/g, "")) || 0;
      const feasibility = checkBudgetFeasibility(
        numericBudget,
        tripData.currency || "USD",
        tripData.tripDays || 5,
        tripData.destination || "your destination"
      );

      if (!feasibility.possible && feasibility.message) {
        await streamResponse(res, feasibility.message);
        res.write("data: [DONE]\n\n");
        return res.end();
      }
    }

    

    // ===== STEP 4: PERFORM WEB SEARCH (If needed) =====
    let webSearchResults = null;
    if (analysis.needsWebSearch) {
      console.log("🌐 Performing web search...");
      try {
        webSearchResults = await performLiveSearch(message);
        console.log("✅ Web search completed");
      } catch (err) {
        console.warn("⚠️ Web search failed:", err.message);
      }
    }

    // ===== STEP 5: HANDLE TRIP MODIFICATIONS =====
    if (analysis.isModification) {
      const intent = detectIntent(message, conversationHistory);
      
      if (intent.action) {
        const intentResponse = handleIntentResponse(intent, tripData);
        
        if (intentResponse.message) {
          await streamResponse(res, intentResponse.message);
          
          // Save to memory
          if (tripId) {
            await saveChatMessage(tripId, "user", message);
            await saveChatMessage(tripId, "assistant", intentResponse.message);
          }

          // Trigger itinerary update if needed
          if (intentResponse.shouldUpdate && tripId) {
            scheduleItineraryUpdate(tripId, tripData, intentResponse.updates, intentResponse.fullRegen);
          }

          res.write("data: [DONE]\n\n");
          return res.end();
        }
      }
    }

    // ===== STEP 6: ROUTE TO APPROPRIATE BRAIN =====
    console.log(`🎯 Routing to ${analysis.suggestedBrain.toUpperCase()} brain`);

    // Build enriched context with web search results
    const enrichedContext = {
      message,
      tripData,
      conversationHistory,
      tripId,
      webSearchResults, // Pass web search results to brain
      analysis // Pass analysis to brain
    };

    let response = "";
switch (analysis.suggestedBrain) {
  case "ultra":
    response = await routeToUltraBrain(enrichedContext, res);
    break;

  case "perfect":
    response = await routeToPerfectBrain(enrichedContext, res);
    break;

  case "smart":
  default:
    response = await routeToSmartBrain(enrichedContext, res);
    break;
}

// ✨ STEP 2 — Unified Voice Layer ✨
// Make every reply sound like Olivia (or matched agent)
if (response && typeof response === "string") {
  try {
    const consultant = tripData?.agentData?.name || "Olivia Chen";
    const unifierPrompt = `
You are ${consultant}, a premium travel consultant.
Rephrase this response in your natural tone — confident, kind, and human:
"${response}"
It should sound warm, personal, and conversational.
`;

    const unify = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      temperature: 0.7,
      messages: [{ role: "system", content: unifierPrompt }]
    });

    const unified = unify.choices?.[0]?.message?.content?.trim() || response;
    await streamResponse(res, unified);
  } catch (err) {
    console.warn("⚠️ Voice unification failed, sending raw response:", err.message);
    await streamResponse(res, response);
  }
} else {
  await streamResponse(res, "I’m here and ready to help. Could you please repeat that?");
}

res.write("data: [DONE]\n\n");
res.end();

  } catch (err) {
    console.error("❌ Master Coordinator Error:", err);
    await streamResponse(res, "I apologize, something went wrong. Please try again.");
    res.write("data: [DONE]\n\n");
    res.end();
  }
}
// ===============================
// BRAIN ROUTERS
// ===============================

async function routeToUltraBrain(context, res) {
  console.log("🚀 Ultra Brain: Handling brief/factual query");
  
  // Ultra brain expects specific request format
  const ultraReq = {
    body: {
      message: context.message,
      tripData: context.tripData,
      conversationHistory: context.conversationHistory
    }
  };

  await handleUltraChat(ultraReq, res);
  return "ultra_handled";
}

async function routeToPerfectBrain(context, res) {
  console.log("💫 Perfect Brain: Handling conversational query");
  
  const perfectReq = {
    body: {
      message: context.message,
      tripData: context.tripData,
      conversationHistory: context.conversationHistory
    }
  };

res.setHeader("Content-Type", "text/event-stream");
res.setHeader("Cache-Control", "no-cache");
res.setHeader("Connection", "keep-alive");

await handlePerfectChat(perfectReq, res);

  return "perfect_handled";
}

async function routeToSmartBrain(context, res) {
  console.log("🧠 Smart Brain: Handling complex travel query");
  
  // Get chat history helper functions
  const getChatHistory = (id, limit = 8) => {
    // Your existing getChatHistory function
    const trip = memoryDB.data.trips.find(t => t.tripId === id);
    if (!trip || !trip.messages) return [];
    return trip.messages.slice(-limit);
  };

  const saveChatMessage = async (id, role, content) => {
    // Your existing saveChatMessage function
    const trip = memoryDB.data.trips.find(t => t.tripId === id);
    if (!trip) return;
    if (!trip.messages) trip.messages = [];
    trip.messages.push({ role, content, timestamp: new Date().toISOString() });
    trip.lastUpdated = new Date().toISOString();
    await memoryDB.write();
  };

  // Build enhanced prompt with web search results
  let enhancedMessage = context.message;
  if (context.webSearchResults) {
    enhancedMessage = `User query: "${context.message}"\n\nWeb search results:\n${context.webSearchResults}\n\nUse these search results to provide an accurate, current answer.`;
  }

  const chatConfig = await handleIntelligentChat(
    enhancedMessage,
    context.tripData,
    context.conversationHistory,
    context.tripId,
    getChatHistory,
    saveChatMessage
  );

  // Stream response from OpenAI
  const completion = await openai.chat.completions.create(chatConfig);

  let fullResponse = "";
  for await (const chunk of completion) {
    const token = chunk.choices?.[0]?.delta?.content || "";
    if (token) {
      fullResponse += token;
      res.write(`data: ${JSON.stringify({ token })}\n\n`);
    }
  }

  // Save to memory
  if (context.tripId && fullResponse) {
    await saveChatMessage(context.tripId, "user", context.message);
    await saveChatMessage(context.tripId, "assistant", fullResponse);
  }

  return "smart_handled";
}

// ===============================
// HELPER FUNCTIONS
// ===============================

async function streamResponse(res, text, delayMs = 8) {
  for (const char of text) {
    res.write(`data: ${JSON.stringify({ token: char })}\n\n`);
    if (delayMs) await new Promise(r => setTimeout(r, delayMs));
  }
}

// ===============================
// EXPRESS INTEGRATION
// ===============================

export function setupMasterCoordinator(app) {
  // Main unified endpoint
  app.post("/api/chat", masterCoordinator);
  
  console.log("✅ SKYmora Master Intelligence Coordinator activated");
  console.log("📊 Features:");
  console.log("   - Intelligent query analysis");
  console.log("   - Automatic web search detection");
  console.log("   - Real-time data handling");
  console.log("   - Smart brain routing");
  console.log("   - Unified memory system");
}

export default {
  masterCoordinator,
  setupMasterCoordinator,
  analyzer
};