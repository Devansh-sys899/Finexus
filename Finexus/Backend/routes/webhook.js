/**
 * routes/webhook.js
 * ─────────────────────────────────────────────
 * Webhook route that receives chat messages from
 * the frontend (or any external integration).
 * Forwards them to the parentAgent for intent
 * detection and sub‑agent routing.
 */

const express = require("express");
const router = express.Router();
const { processMessage } = require("../controllers/parentAgent");
const { protect } = require("../middlewares/authMiddleware");
const { asyncHandler } = require("../utils/errorHandler");

/**
 * POST /api/webhook
 *
 * Body:
 *   {
 *     "message": "I spent 500 on groceries today"
 *   }
 *
 * Headers:
 *   Authorization: Bearer <jwt>
 *
 * Returns:
 *   {
 *     "success": true,
 *     "agent": "expenseAgent",
 *     "message": "Expense added successfully",
 *     "data": { ... }
 *   }
 */
router.post(
  "/",
  protect,
  asyncHandler(async (req, res) => {
    const { message } = req.body;
    const userId = req.user.id;

    // Delegate to the parent agent
    const result = await processMessage(userId, message);

    // Determine HTTP status based on the result
    const status = result.success === false ? 400 : 200;

    res.status(status).json(result);
  })
);

module.exports = router;
