/**
 * controllers/analyticsAgent.js
 * ─────────────────────────────────────────────
 * Sub‑agent responsible for computing and
 * returning financial analytics for a user.
 * Aggregates data from Expenses, Invoices, and
 * Reminders, with optional caching via the
 * Analytics model.
 */

const Expense = require("../models/Expense");
const Invoice = require("../models/Invoice");
const Reminder = require("../models/Reminder");
const Analytics = require("../models/Analytics");
const { ApiError } = require("../utils/errorHandler");

// ──────────── Helpers ────────────

const response = (message, data = null) => ({
  success: true,
  agent: "analyticsAgent",
  message,
  data,
});

// ──────────── Core computation ────────────

/**
 * Compute a complete analytics snapshot for the user.
 *
 * @param {string} userId
 * @returns {Promise<object>} The analytics payload
 */
const computeAnalytics = async (userId) => {
  // ── Expense aggregations ──
  const totalSpending = await Expense.totalSpending(userId);

  const categoryBreakdown = await Expense.spendingByCategory(userId);

  const expenseCount = await Expense.countDocuments({ userId });

  const averageExpense = expenseCount > 0 ? totalSpending / expenseCount : 0;

  // Identify top category
  const topCategory =
    categoryBreakdown.length > 0 ? categoryBreakdown[0]._id : "N/A";

  // Add percentage to each category
  const categoryWithPct = categoryBreakdown.map((c) => ({
    category: c._id,
    total: c.total,
    count: c.count || 0,
    percentage:
      totalSpending > 0
        ? Math.round((c.total / totalSpending) * 10000) / 100
        : 0,
  }));

  // Monthly trends (last 6 months)
  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

  const monthlyTrends = await Expense.aggregate([
    {
      $match: {
        userId: Expense.base.Types.ObjectId.createFromHexString(userId.toString()),
        date: { $gte: sixMonthsAgo },
      },
    },
    {
      $group: {
        _id: {
          $dateToString: { format: "%Y-%m", date: "$date" },
        },
        total: { $sum: "$amount" },
        count: { $sum: 1 },
      },
    },
    { $sort: { _id: 1 } },
    {
      $project: {
        _id: 0,
        month: "$_id",
        total: 1,
        count: 1,
      },
    },
  ]);

  // ── Invoice aggregations ──
  const invoiceSummary = await Invoice.summaryByStatus(userId);
  const totalInvoiced = invoiceSummary.reduce(
    (sum, s) => sum + s.totalAmount,
    0
  );
  const invoiceCount = invoiceSummary.reduce((sum, s) => sum + s.count, 0);
  const invoicesByStatus = {};
  invoiceSummary.forEach((s) => {
    invoicesByStatus[s._id] = s.count;
  });

  // ── Reminder aggregations ──
  const totalReminders = await Reminder.countDocuments({ userId });
  const pendingReminders = await Reminder.countDocuments({
    userId,
    status: "pending",
  });
  const completedReminders = await Reminder.countDocuments({
    userId,
    status: "completed",
  });

  return {
    expenses: {
      totalSpending,
      expenseCount,
      averageExpense: Math.round(averageExpense * 100) / 100,
      topCategory,
      categoryBreakdown: categoryWithPct,
      monthlyTrends,
    },
    invoices: {
      totalInvoiced,
      invoiceCount,
      byStatus: invoicesByStatus,
    },
    reminders: {
      totalReminders,
      pendingReminders,
      completedReminders,
    },
    computedAt: new Date().toISOString(),
  };
};

// ──────────── Agent action ────────────

/**
 * Get analytics for the authenticated user.
 * Uses the cached snapshot if not stale; otherwise recomputes.
 *
 * @param {string} userId
 * @param {object} [entities] - Optional { period, category } filters (future use)
 * @returns {Promise<object>}
 */
const getAnalytics = async (userId, entities = {}) => {
  try {
    // Check if cache is fresh (within 5 minutes)
    const stale = await Analytics.isStale(userId, 5 * 60 * 1000);

    if (!stale) {
      const cached = await Analytics.findOne({ userId });
      if (cached) {
        return response("Analytics retrieved (cached)", cached);
      }
    }

    // Compute fresh analytics
    const analytics = await computeAnalytics(userId);

    // Upsert the cache
    await Analytics.findOneAndUpdate(
      { userId },
      {
        userId,
        totalExpenses: analytics.expenses.totalSpending,
        expenseCount: analytics.expenses.expenseCount,
        averageExpense: analytics.expenses.averageExpense,
        topCategory: analytics.expenses.topCategory,
        categoryBreakdown: analytics.expenses.categoryBreakdown,
        monthlyTrends: analytics.expenses.monthlyTrends,
        totalInvoiced: analytics.invoices.totalInvoiced,
        invoiceCount: analytics.invoices.invoiceCount,
        invoicesByStatus: analytics.invoices.byStatus,
        totalReminders: analytics.reminders.totalReminders,
        pendingReminders: analytics.reminders.pendingReminders,
        completedReminders: analytics.reminders.completedReminders,
        lastComputedAt: new Date(),
      },
      { upsert: true, new: true }
    );

    return response("Analytics computed successfully", analytics);
  } catch (err) {
    console.error("❌  Analytics computation failed:", err.message);
    throw new ApiError(500, "Failed to compute analytics", {
      reason: err.message,
    });
  }
};

/**
 * Route intent to analytics action.
 */
const handle = async (intent, userId, entities) => {
  switch (intent) {
    case "get_analytics":
      return getAnalytics(userId, entities);
    default:
      throw new ApiError(400, `Unsupported analytics intent: ${intent}`);
  }
};

module.exports = { handle, getAnalytics, computeAnalytics };
