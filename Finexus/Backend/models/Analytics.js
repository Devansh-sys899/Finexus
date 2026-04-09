/**
 * models/Analytics.js
 * ─────────────────────────────────────────────
 * Mongoose schema & model for cached analytics
 * snapshots. Stores pre‑computed aggregation
 * results so frequently‑requested dashboards
 * don't hammer the database.
 */

const mongoose = require("mongoose");

const categoryBreakdownSchema = new mongoose.Schema(
  {
    category: { type: String, required: true },
    total: { type: Number, required: true, default: 0 },
    count: { type: Number, required: true, default: 0 },
    percentage: { type: Number, default: 0 },
  },
  { _id: false }
);

const monthlyTrendSchema = new mongoose.Schema(
  {
    month: { type: String, required: true }, // "2026-04"
    total: { type: Number, required: true, default: 0 },
    count: { type: Number, required: true, default: 0 },
  },
  { _id: false }
);

const analyticsSchema = new mongoose.Schema(
  {
    /** Reference to the owning user */
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "userId is required"],
      unique: true,
      index: true,
    },

    /** ── Expense analytics ── */
    totalExpenses: { type: Number, default: 0 },
    expenseCount: { type: Number, default: 0 },
    averageExpense: { type: Number, default: 0 },
    topCategory: { type: String, default: "N/A" },
    categoryBreakdown: [categoryBreakdownSchema],
    monthlyTrends: [monthlyTrendSchema],

    /** ── Invoice analytics ── */
    totalInvoiced: { type: Number, default: 0 },
    invoiceCount: { type: Number, default: 0 },
    invoicesByStatus: {
      type: Map,
      of: Number,
      default: {},
    },

    /** ── Reminder analytics ── */
    totalReminders: { type: Number, default: 0 },
    pendingReminders: { type: Number, default: 0 },
    completedReminders: { type: Number, default: 0 },

    /** When this snapshot was last computed */
    lastComputedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

// ──────────── Statics ────────────

/**
 * Check whether the cached snapshot is stale (older than `maxAgeMs`).
 * @param {ObjectId} userId
 * @param {number}   [maxAgeMs=300000] Default 5 minutes.
 * @returns {Promise<boolean>}
 */
analyticsSchema.statics.isStale = async function (userId, maxAgeMs = 300000) {
  const snap = await this.findOne({ userId }).select("lastComputedAt");
  if (!snap) return true; // no snapshot yet
  return Date.now() - snap.lastComputedAt.getTime() > maxAgeMs;
};

module.exports = mongoose.model("Analytics", analyticsSchema);
