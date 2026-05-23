// ================================
// SKYmora — agent-routes-lite.js
// 6 endpoints. Launch-ready.
// ================================

import { v4 as uuidv4 } from "uuid";
import { MODES } from "./agent-system-lite.js";
import { cancelDraftTimer } from "./agent-draft-lite.js";

export function setupAgentRoutesLite(app, memoryDB) {

  function getConvo(tripId) {
    return memoryDB.data.conversations.find(c => c.tripId === tripId) || null;
  }

  function emit(event, room, data) {
    if (global.io) global.io.to(room).emit(event, data);
  }

  // 1. SET MODE — AUTO / REVIEW / TAKEOVER
  app.post("/api/agent/mode", async (req, res) => {
    try {
      const { tripId, mode, agentName } = req.body;
      if (!tripId || !mode) return res.status(400).json({ error: "tripId and mode required" });
      if (!Object.values(MODES).includes(mode)) return res.status(400).json({ error: `Invalid mode. Use: ${Object.values(MODES).join(", ")}` });

      const convo = getConvo(tripId);
      if (!convo) return res.status(404).json({ error: "Conversation not found" });

      const previousMode = convo.mode || MODES.AUTO;
      convo.mode = mode;
      convo.lastUpdated = new Date().toISOString();

      if (mode === MODES.TAKEOVER) {
        if (agentName) convo.assignedAgent = agentName;
        if (convo.pendingDraft) { cancelDraftTimer(tripId); convo.pendingDraft = null; }
      }

      if (mode === MODES.AUTO) {
        convo.assignedAgent = null;
        if (convo.pendingDraft) { cancelDraftTimer(tripId); convo.pendingDraft = null; }
      }

      convo.messages.push({ id: uuidv4(), role: "system", content: `Mode changed: ${previousMode} → ${mode}${agentName ? ` by ${agentName}` : ""}`, timestamp: new Date().toISOString() });

      await memoryDB.write();

      emit("modeChanged", tripId, { tripId, previousMode, mode, agentName });
      if (agentName) emit("modeChanged", `agent_${agentName}`, { tripId, previousMode, mode });

      res.json({ success: true, tripId, mode, previousMode });
    } catch (err) { res.status(500).json({ error: err.message }); }
  });

  // 2. ASSIGN AGENT
  app.post("/api/agent/assign", async (req, res) => {
    try {
      const { tripId, agentName } = req.body;
      if (!tripId || !agentName) return res.status(400).json({ error: "tripId and agentName required" });

      const convo = getConvo(tripId);
      if (!convo) return res.status(404).json({ error: "Conversation not found" });

      convo.assignedAgent = agentName;
      convo.lastUpdated = new Date().toISOString();
      convo.messages.push({ id: uuidv4(), role: "system", content: `${agentName} assigned to this conversation`, timestamp: new Date().toISOString() });

      await memoryDB.write();
      emit("agentAssigned", tripId, { tripId, agentName });
      res.json({ success: true, tripId, agentName });
    } catch (err) { res.status(500).json({ error: err.message }); }
  });

  // 3. RELEASE BACK TO AI
  app.post("/api/agent/release", async (req, res) => {
    try {
      const { tripId, agentName } = req.body;
      if (!tripId) return res.status(400).json({ error: "tripId required" });

      const convo = getConvo(tripId);
      if (!convo) return res.status(404).json({ error: "Conversation not found" });

      const previousAgent = convo.assignedAgent;
      convo.assignedAgent = null;
      convo.mode = MODES.AUTO;
      convo.lastUpdated = new Date().toISOString();

      if (convo.pendingDraft) { cancelDraftTimer(tripId); convo.pendingDraft = null; }

      convo.messages.push({ id: uuidv4(), role: "system", content: `${agentName || previousAgent || "Agent"} released conversation back to AI`, timestamp: new Date().toISOString() });

      await memoryDB.write();
      emit("releasedToAI", tripId, { tripId, agentName: agentName || previousAgent });
      emit("modeChanged", tripId, { tripId, mode: MODES.AUTO, agentName });
      res.json({ success: true, tripId, mode: MODES.AUTO });
    } catch (err) { res.status(500).json({ error: err.message }); }
  });

  // 4. APPROVE DRAFT — send as-is
  app.post("/api/agent/draft/approve", async (req, res) => {
    try {
      const { tripId, agentName } = req.body;
      if (!tripId) return res.status(400).json({ error: "tripId required" });

      const convo = getConvo(tripId);
      if (!convo) return res.status(404).json({ error: "Conversation not found" });
      if (!convo.pendingDraft) return res.status(400).json({ error: "No pending draft" });

      cancelDraftTimer(tripId);
      const text = convo.pendingDraft.text;
      const draftId = convo.pendingDraft.draftId;

      const msg = { id: uuidv4(), role: "assistant", content: text, timestamp: new Date().toISOString(), draftId, approvedBy: agentName, draftStatus: "approved" };

      convo.messages.push(msg);
      convo.pendingDraft = null;
      convo.lastUpdated = new Date().toISOString();
      await memoryDB.write();

      emit("newMessage", tripId, { role: "assistant", content: text });
      if (agentName) emit("draftApproved", `agent_${agentName}`, { tripId, draftId });
      res.json({ success: true, message: msg });
    } catch (err) { res.status(500).json({ error: err.message }); }
  });

  // 5. EDIT DRAFT then send
  app.post("/api/agent/draft/edit", async (req, res) => {
    try {
      const { tripId, agentName, newText } = req.body;
      if (!tripId || !newText) return res.status(400).json({ error: "tripId and newText required" });

      const convo = getConvo(tripId);
      if (!convo) return res.status(404).json({ error: "Conversation not found" });
      if (!convo.pendingDraft) return res.status(400).json({ error: "No pending draft to edit" });

      cancelDraftTimer(tripId);
      const originalText = convo.pendingDraft.text;
      const draftId = convo.pendingDraft.draftId;

      const msg = { id: uuidv4(), role: "assistant", content: newText, timestamp: new Date().toISOString(), draftId, draftStatus: "edited", editedBy: agentName, originalText };

      convo.messages.push(msg);
      convo.pendingDraft = null;
      convo.lastUpdated = new Date().toISOString();
      await memoryDB.write();

      emit("newMessage", tripId, { role: "assistant", content: newText });
      if (agentName) emit("draftEdited", `agent_${agentName}`, { tripId, draftId, originalText, newText });
      res.json({ success: true, message: msg });
    } catch (err) { res.status(500).json({ error: err.message }); }
  });

  // 6. AGENT DIRECT MESSAGE — TAKEOVER only
  app.post("/api/agent/message", async (req, res) => {
    try {
      const { tripId, agentName, message } = req.body;
      if (!tripId || !agentName || !message || !message.trim()) return res.status(400).json({ error: "tripId, agentName, and message required" });

      const convo = getConvo(tripId);
      if (!convo) return res.status(404).json({ error: "Conversation not found" });
      if (convo.mode !== MODES.TAKEOVER) return res.status(400).json({ error: `Direct messages only allowed in TAKEOVER mode. Current: ${convo.mode}` });
      if (convo.assignedAgent && convo.assignedAgent !== agentName) return res.status(403).json({ error: "Not assigned to this conversation" });

      const msg = { id: uuidv4(), role: "agent", agentName, content: message, timestamp: new Date().toISOString() };

      convo.messages.push(msg);
      convo.lastUpdated = new Date().toISOString();
      await memoryDB.write();

      emit("newMessage", tripId, { role: "agent", agentName, content: message });
      res.json({ success: true, message: msg });
    } catch (err) { res.status(500).json({ error: err.message }); }
  });

  console.log("✅ SKYmora Agent Routes — 6 endpoints ready");
}