/**
 * routes/expenses.js
 * ─────────────────────────────────────────────
 * RESTful routes for direct expense management.
 * These are in addition to the webhook / chat
 * interface — useful for dashboard UI calls.
 */

const express = require("express");
const router = express.Router();
const { protect } = require("../middlewares/authMiddleware");
const { asyncHandler } = require("../utils/errorHandler");
const expenseAgent = require("../controllers/expenseAgent");

/**
 * GET /api/expenses
 * List expenses for the authenticated user.
 * Query params: category, from, to, limit
 */
router.get(
  "/",
  protect,
  asyncHandler(async (req, res) => {
    const result = await expenseAgent.getExpenses(req.user.id, req.query);
    res.json(result);
  })
);

/**
 * POST /api/expenses
 * Add a new expense.
 */
router.post(
  "/",
  protect,
  asyncHandler(async (req, res) => {
    const result = await expenseAgent.addExpense(req.user.id, req.body);
    res.status(201).json(result);
  })
);

/**
 * PUT /api/expenses/:id
 * Update an existing expense.
 */
router.put(
  "/:id",
  protect,
  asyncHandler(async (req, res) => {
    const entities = { ...req.body, expenseId: req.params.id };
    const result = await expenseAgent.updateExpense(req.user.id, entities);
    res.json(result);
  })
);

/**
 * DELETE /api/expenses/:id
 * Delete an expense.
 */
router.delete(
  "/:id",
  protect,
  asyncHandler(async (req, res) => {
    const result = await expenseAgent.deleteExpense(req.user.id, {
      expenseId: req.params.id,
    });
    res.json(result);
  })
);

module.exports = router;
