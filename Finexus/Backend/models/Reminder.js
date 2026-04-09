/**
 * models/Reminder.js
 * ─────────────────────────────────────────────
 * Mongoose schema & model for user reminders.
 * Stores scheduled date/time, task description,
 * and completion status.
 */

const mongoose = require("mongoose");

const reminderSchema = new mongoose.Schema(
  {
    /** Reference to the owning user */
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "userId is required"],
      index: true,
    },

    /** Short title for the reminder */
    title: {
      type: String,
      required: [true, "Title is required"],
      trim: true,
      maxlength: [200, "Title cannot exceed 200 characters"],
    },

    /** Detailed description of the task */
    description: {
      type: String,
      trim: true,
      maxlength: [1000, "Description cannot exceed 1000 characters"],
      default: "",
    },

    /** When the reminder should fire */
    scheduledAt: {
      type: Date,
      required: [true, "Scheduled date/time is required"],
      validate: {
        validator: function (v) {
          // Only validate on creation (not when updating status)
          if (this.isNew) {
            return v > new Date();
          }
          return true;
        },
        message: "Scheduled date must be in the future",
      },
    },

    /** Reminder priority */
    priority: {
      type: String,
      enum: ["low", "medium", "high"],
      default: "medium",
    },

    /** Current status */
    status: {
      type: String,
      enum: ["pending", "completed", "dismissed"],
      default: "pending",
    },

    /** Whether the user has been notified */
    notified: {
      type: Boolean,
      default: false,
    },

    /** Category / tag for grouping */
    category: {
      type: String,
      trim: true,
      lowercase: true,
      default: "general",
    },
  },
  {
    timestamps: true,
  }
);

// ──────────── Indexes ────────────
reminderSchema.index({ userId: 1, scheduledAt: 1 });
reminderSchema.index({ status: 1, scheduledAt: 1 });

// ──────────── Statics ────────────

/**
 * Fetch upcoming reminders for a user that are still pending.
 * @param {ObjectId} userId
 * @param {number}   [limit=10]
 * @returns {Promise<Array>}
 */
reminderSchema.statics.upcoming = function (userId, limit = 10) {
  return this.find({
    userId,
    status: "pending",
    scheduledAt: { $gte: new Date() },
  })
    .sort({ scheduledAt: 1 })
    .limit(limit);
};

/**
 * Fetch past‑due reminders that haven't been notified yet.
 * @param {ObjectId} userId
 * @returns {Promise<Array>}
 */
reminderSchema.statics.overdue = function (userId) {
  return this.find({
    userId,
    status: "pending",
    notified: false,
    scheduledAt: { $lt: new Date() },
  }).sort({ scheduledAt: 1 });
};

module.exports = mongoose.model("Reminder", reminderSchema);
