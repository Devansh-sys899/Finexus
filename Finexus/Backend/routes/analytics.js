/**
 * routes/analytics.js
 * ─────────────────────────────────────────────
 * Route for fetching user analytics / dashboard data.
 */

const express = require("express");
const router = express.Router();
const { protect } = require("../middlewares/authMiddleware");
const { asyncHandler } = require("../utils/errorHandler");
const analyticsAgent = require("../controllers/analyticsAgent");

/**
 * GET /api/analytics
 * Fetch aggregated analytics for the authenticated user.
 */
router.get(
  "/",
  protect,
  asyncHandler(async (req, res) => {
    const result = await analyticsAgent.getAnalytics(req.user.id, req.query);
    res.json(result);
  })
);

module.exports = router;
