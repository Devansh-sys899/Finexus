/**
 * models/Expense.js
 * ─────────────────────────────────────────────
 * Mongoose schema & model for user expenses.
 * Tracks amount, category, date, and an
 * optional description per transaction.
 */

const mongoose = require("mongoose");

/** Allowed expense categories */
const CATEGORIES = [
  "food",
  "transport",
  "utilities",
  "entertainment",
  "healthcare",
  "shopping",
  "education",
  "rent",
  "salary",
  "investment",
  "other",
];

const expenseSchema = new mongoose.Schema(
  {
    /** Reference to the owning user */
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "userId is required"],
      index: true,
    },

    /** Monetary amount (must be positive) */
    amount: {
      type: Number,
      required: [true, "Amount is required"],
      min: [0.01, "Amount must be greater than zero"],
    },

    /** Expense category */
    category: {
      type: String,
      required: [true, "Category is required"],
      lowercase: true,
      trim: true,
      enum: {
        values: CATEGORIES,
        message: `Category must be one of: ${CATEGORIES.join(", ")}`,
      },
    },

    /** When the expense occurred */
    date: {
      type: Date,
      default: Date.now,
    },

    /** Optional description */
    description: {
      type: String,
      trim: true,
      maxlength: [500, "Description cannot exceed 500 characters"],
      default: "",
    },

    /** Currency code (ISO 4217) */
    currency: {
      type: String,
      default: "INR",
      uppercase: true,
      maxlength: 3,
    },
  },
  {
    timestamps: true,
  }
);

// ──────────── Indexes ────────────
expenseSchema.index({ userId: 1, date: -1 });
expenseSchema.index({ userId: 1, category: 1 });

// ──────────── Statics ────────────

/**
 * Aggregate total spending per category for a given user.
 * @param {ObjectId} userId
 * @returns {Promise<Array<{ _id: string, total: number }>>}
 */
expenseSchema.statics.spendingByCategory = function (userId) {
  return this.aggregate([
    { $match: { userId: new mongoose.Types.ObjectId(userId) } },
    { $group: { _id: "$category", total: { $sum: "$amount" } } },
    { $sort: { total: -1 } },
  ]);
};

/**
 * Calculate total spending for a user within optional date bounds.
 * @param {ObjectId} userId
 * @param {Date}     [from]
 * @param {Date}     [to]
 * @returns {Promise<number>}
 */
expenseSchema.statics.totalSpending = async function (userId, from, to) {
  const match = { userId: new mongoose.Types.ObjectId(userId) };
  if (from || to) {
    match.date = {};
    if (from) match.date.$gte = new Date(from);
    if (to) match.date.$lte = new Date(to);
  }

  const result = await this.aggregate([
    { $match: match },
    { $group: { _id: null, total: { $sum: "$amount" } } },
  ]);

  return result.length ? result[0].total : 0;
};

module.exports = mongoose.model("Expense", expenseSchema);
