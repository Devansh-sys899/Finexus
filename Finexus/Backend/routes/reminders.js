/**
 * routes/reminders.js
 * ─────────────────────────────────────────────
 * RESTful routes for direct reminder management.
 */

const express = require("express");
const router = express.Router();
const { protect } = require("../middlewares/authMiddleware");
const { asyncHandler } = require("../utils/errorHandler");
const reminderAgent = require("../controllers/reminderAgent");

/**
 * GET /api/reminders
 * List reminders for the authenticated user.
 * Query params: status, limit
 */
router.get(
  "/",
  protect,
  asyncHandler(async (req, res) => {
    const result = await reminderAgent.getReminders(req.user.id, req.query);
    res.json(result);
  })
);

/**
 * POST /api/reminders
 * Create a new reminder.
 */
router.post(
  "/",
  protect,
  asyncHandler(async (req, res) => {
    const result = await reminderAgent.addReminder(req.user.id, req.body);
    res.status(201).json(result);
  })
);

/**
 * PATCH /api/reminders/:id/complete
 * Mark a reminder as completed.
 */
router.patch(
  "/:id/complete",
  protect,
  asyncHandler(async (req, res) => {
    const result = await reminderAgent.completeReminder(req.user.id, {
      reminderId: req.params.id,
    });
    res.json(result);
  })
);

module.exports = router;
