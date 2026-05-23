// ================================
// SKYmora — agent-draft-lite.js
// ================================

import { v4 as uuidv4 } from "uuid";

const DRAFT_EXPIRY_MS = 30000; // 30 seconds
const activeTimers = new Map();

export async function holdDraft(convo, aiText, memoryDB) {
  // Cancel any existing timer for this trip
  if (activeTimers.has(convo.tripId)) {
    clearTimeout(activeTimers.get(convo.tripId));
    activeTimers.delete(convo.tripId);
  }

  const draftId = uuidv4();

  convo.pendingDraft = {
    draftId,
    text: aiText,
    createdAt: new Date().toISOString(),
    expiresAt: new Date(Date.now() + DRAFT_EXPIRY_MS).toISOString()
  };

  convo.lastUpdated = new Date().toISOString();
  await memoryDB.write();

  // Notify agent via their private socket room
  if (global.io && convo.assignedAgent) {
    global.io.to(`agent_${convo.assignedAgent}`).emit("aiDraft", {
      tripId: convo.tripId,
      draftId,
      draft: aiText,
      expiresInSeconds: 30
    });
  }

  // Also notify the trip room
  if (global.io) {
    global.io.to(convo.tripId).emit("aiDraft", {
      tripId: convo.tripId,
      draftId,
      draft: aiText,
      expiresInSeconds: 30
    });
  }

  // Auto-send timer — if agent does nothing in 30s, send automatically
  const timer = setTimeout(async () => {
    activeTimers.delete(convo.tripId);

    if (convo.pendingDraft?.draftId === draftId) {
      const text = convo.pendingDraft.text;

      convo.messages.push({
        id: uuidv4(),
        role: "assistant",
        content: text,
        timestamp: new Date().toISOString(),
        autoSent: true,
        draftId
      });

      convo.pendingDraft = null;
      convo.lastUpdated = new Date().toISOString();

      try { await memoryDB.write(); } catch (e) { console.error("Auto-send write error:", e.message); }

      if (global.io) {
        global.io.to(convo.tripId).emit("newMessage", {
          role: "assistant",
          content: text,
          autoSent: true
        });
      }

      if (global.io && convo.assignedAgent) {
        global.io.to(`agent_${convo.assignedAgent}`).emit("draftAutoSent", {
          tripId: convo.tripId,
          draftId,
          message: "Draft auto-sent — no action taken within 30 seconds."
        });
      }
    }
  }, DRAFT_EXPIRY_MS);

  activeTimers.set(convo.tripId, timer);
}

export function cancelDraftTimer(tripId) {
  if (activeTimers.has(tripId)) {
    clearTimeout(activeTimers.get(tripId));
    activeTimers.delete(tripId);
  }
}

export function getDraftTimeRemaining(convo) {
  if (!convo.pendingDraft?.expiresAt) return 0;
  const ms = new Date(convo.pendingDraft.expiresAt).getTime() - Date.now();
  return Math.max(0, Math.round(ms / 1000));
}