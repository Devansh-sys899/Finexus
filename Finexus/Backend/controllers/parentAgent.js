/**
 * controllers/parentAgent.js
 * ─────────────────────────────────────────────
 * Central orchestrator:
 * 1. Detect intent (LLM)
 * 2. Route to agent
 * 3. Enrich with analytics
 * 4. Generate smart response (LLM)
 */

const { getIntent, generateResponse } = require("../utils/chatGPT");
const { ApiError } = require("../utils/errorHandler");
const Expense = require("../models/Expense");

// Agents
const expenseAgent = require("./expenseAgent");
const invoiceAgent = require("./invoiceAgent");
const analyticsAgent = require("./analyticsAgent");
const reminderAgent = require("./reminderAgent");

// Intent → Agent map
const INTENT_AGENT_MAP = {
  add_expense: expenseAgent,
  get_expenses: expenseAgent,
  update_expense: expenseAgent,
  delete_expense: expenseAgent,

  create_invoice: invoiceAgent,
  get_invoices: invoiceAgent,
  send_invoice: invoiceAgent,

  get_analytics: analyticsAgent,

  add_reminder: reminderAgent,
  get_reminders: reminderAgent,
  complete_reminder: reminderAgent,
};

const processMessage = async (userId, userMessage) => {
  if (!userMessage || typeof userMessage !== "string" || !userMessage.trim()) {
    throw new ApiError(400, "Message cannot be empty");
  }

  if (!userId) {
    throw new ApiError(401, "User authentication required");
  }

  let intentResult;

  // ── 1. Intent detection ──
  try {
    intentResult = await getIntent(userMessage);
  } catch (err) {
    console.error("❌ Intent detection failed:", err.message);
    throw new ApiError(500, "Failed to understand request");
  }

  const { intent, entities = {}, confidence = 0 } = intentResult;

  console.log(
    `🧠 Intent: ${intent} | Confidence: ${confidence}`,
    entities
  );

  // ── 2. Handle unknown intent ──
  if (intent === "unknown" || confidence < 0.3) {
    return {
      success: true,
      reply:
        "I’m not sure what you mean 🤔\n\nYou can ask me to:\n• Add expenses\n• Create invoices\n• Show analytics\n• Set reminders",
    };
  }

  // ── 3. Route to agent ──
  const agent = INTENT_AGENT_MAP[intent];

  console.log("Agent selected:", agent);

  if (!agent) {
    return {
      success: false,
      reply: `I understood "${intent}" but don’t have a handler yet.`,
    };
  }

  let result;

  try {
    result = await agent.handle(intent, userId, entities);
  } catch (err) {
    if (err instanceof ApiError) throw err;

    console.error(`❌ Agent error (${intent}):`, err.message);
    throw new ApiError(500, "Agent processing failed");
  }

  // ── 4. Analytics enrichment ──
  let analytics = {};

  try {
    if (intent === "add_expense" || intent === "get_analytics") {
      const expenses = await Expense.find({ userId });

      const total = expenses.reduce((sum, e) => sum + e.amount, 0);

      const categoryMap = {};
      expenses.forEach((e) => {
        categoryMap[e.category] =
          (categoryMap[e.category] || 0) + e.amount;
      });

      let topCategory = "none";

      if (Object.keys(categoryMap).length > 0) {
        topCategory = Object.keys(categoryMap).reduce((a, b) =>
          categoryMap[a] > categoryMap[b] ? a : b
        );
      }

      analytics = { total, topCategory };
    }
  } catch (err) {
    console.error("⚠️ Analytics failed:", err.message);
  }

  // ── 5. Generate final AI response ──
  try {
    const reply = await generateResponse({
      userMessage,
      intent,
      data: result.data,
      analytics,
    });

    return {
      success: true,
      reply,
    };
  } catch (err) {
    console.error("❌ Response generation failed:", err.message);

    // fallback response
    if (result?.data?.amount && result?.data?.category) {
      return {
        success: true,
        reply: `₹${result.data.amount} added under ${result.data.category} 💸`,
      };
    }

    return {
      success: true,
      reply: "Your request was processed successfully.",
    };
  }
};

module.exports = { processMessage };