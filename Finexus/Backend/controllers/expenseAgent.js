/**
 * controllers/expenseAgent.js
 * ─────────────────────────────────────────────
 * Sub‑agent responsible for all expense‑related
 * operations: create, read, update, delete.
 * Called by the parentAgent after intent detection.
 */

const Expense = require("../models/Expense");
const { ApiError } = require("../utils/errorHandler");

// ──────────── Helpers ────────────

/**
 * Build a standardised response envelope.
 * @param {string} message
 * @param {*}      [data=null]
 * @returns {object}
 */
const response = (message, data = null) => ({
  success: true,
  agent: "expenseAgent",
  message,
  data,
});

/**
 * Validate the mandatory fields for an expense.
 * @param {object} fields
 * @throws {ApiError}
 */
const validateExpenseFields = ({ amount, category }) => {
  if (amount === undefined || amount === null) {
    throw new ApiError(400, "Amount is required");
  }
  if (typeof amount !== "number" || amount <= 0) {
    throw new ApiError(400, "Amount must be a positive number");
  }
  if (!category || typeof category !== "string") {
    throw new ApiError(400, "Category is required and must be a string");
  }
};

// ──────────── Agent actions ────────────

/**
 * Add a new expense for the authenticated user.
 *
 * @param {string} userId
 * @param {object} entities - { amount, category, date, description }
 * @returns {Promise<object>} Standard response
 */
const addExpense = async (userId, entities) => {
  const { amount, category, date, description } = entities;

  validateExpenseFields({ amount, category });

  const expense = await Expense.create({
    userId,
    amount,
    category: category.toLowerCase(),
    date: date ? new Date(date) : new Date(),
    description: description || "",
  });

  return response("Expense added successfully", expense);
};

/**
 * Retrieve expenses for the authenticated user.
 * Supports optional filters: category, from, to, limit.
 *
 * @param {string} userId
 * @param {object} [filters]
 * @returns {Promise<object>}
 */
const getExpenses = async (userId, filters = {}) => {
  const query = { userId };

  if (filters.category) {
    query.category = filters.category.toLowerCase();
  }
  if (filters.from || filters.to) {
    query.date = {};
    if (filters.from) query.date.$gte = new Date(filters.from);
    if (filters.to) query.date.$lte = new Date(filters.to);
  }

  const limit = Math.min(parseInt(filters.limit, 10) || 50, 200);

  const expenses = await Expense.find(query)
    .sort({ date: -1 })
    .limit(limit);

  return response(`Found ${expenses.length} expense(s)`, expenses);
};

/**
 * Update an existing expense by ID.
 *
 * @param {string} userId
 * @param {object} entities - Must include { expenseId } plus fields to update.
 * @returns {Promise<object>}
 */
const updateExpense = async (userId, entities) => {
  const { expenseId, ...updates } = entities;

  if (!expenseId) {
    throw new ApiError(400, "expenseId is required for update");
  }

  // Only allow safe field updates
  const allowed = ["amount", "category", "date", "description"];
  const sanitised = {};
  for (const key of allowed) {
    if (updates[key] !== undefined) sanitised[key] = updates[key];
  }

  const expense = await Expense.findOneAndUpdate(
    { _id: expenseId, userId },
    { $set: sanitised },
    { new: true, runValidators: true }
  );

  if (!expense) {
    throw new ApiError(404, "Expense not found or access denied");
  }

  return response("Expense updated successfully", expense);
};

/**
 * Delete an expense by ID.
 *
 * @param {string} userId
 * @param {object} entities - { expenseId }
 * @returns {Promise<object>}
 */
const deleteExpense = async (userId, entities) => {
  const { expenseId } = entities;

  if (!expenseId) {
    throw new ApiError(400, "expenseId is required for deletion");
  }

  const expense = await Expense.findOneAndDelete({ _id: expenseId, userId });

  if (!expense) {
    throw new ApiError(404, "Expense not found or access denied");
  }

  return response("Expense deleted successfully", { id: expenseId });
};

/**
 * Route an intent to the correct expense action.
 *
 * @param {string} intent   - Detected intent string
 * @param {string} userId   - Authenticated user ID
 * @param {object} entities - Extracted entities from Gemini
 * @returns {Promise<object>}
 */
const handle = async (intent, userId, entities) => {
  switch (intent) {
    case "add_expense":
      return addExpense(userId, entities);
    case "get_expenses":
      return getExpenses(userId, entities);
    case "update_expense":
      return updateExpense(userId, entities);
    case "delete_expense":
      return deleteExpense(userId, entities);
    default:
      throw new ApiError(400, `Unsupported expense intent: ${intent}`);
  }
};

module.exports = {
  handle,
  addExpense,
  getExpenses,
  updateExpense,
  deleteExpense,
};
