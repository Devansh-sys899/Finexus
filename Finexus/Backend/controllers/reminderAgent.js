/**
 * controllers/reminderAgent.js
 * ─────────────────────────────────────────────
 * Sub‑agent responsible for reminder operations:
 * create, list, and complete reminders.
 */

const Reminder = require("../models/Reminder");
const { ApiError } = require("../utils/errorHandler");

// ──────────── Helpers ────────────

const response = (message, data = null) => ({
  success: true,
  agent: "reminderAgent",
  message,
  data,
});

/**
 * Validate mandatory fields for a new reminder.
 * @param {object} fields
 * @throws {ApiError}
 */
const validateReminderFields = ({ title, scheduledAt }) => {
  if (!title || typeof title !== "string" || title.trim().length === 0) {
    throw new ApiError(400, "Title is required");
  }
  if (!scheduledAt) {
    throw new ApiError(400, "Scheduled date/time is required");
  }
  const scheduledDate = new Date(scheduledAt);
  if (isNaN(scheduledDate.getTime())) {
    throw new ApiError(400, "Invalid date format for scheduledAt");
  }
  if (scheduledDate <= new Date()) {
    throw new ApiError(400, "Scheduled date must be in the future");
  }
};

// ──────────── Agent actions ────────────

/**
 * Create a new reminder.
 *
 * @param {string} userId
 * @param {object} entities - { title, description, scheduledAt, priority, category }
 * @returns {Promise<object>}
 */
const addReminder = async (userId, entities) => {
  const { title, description, scheduledAt, priority, category } = entities;

  validateReminderFields({ title, scheduledAt });

  const reminder = await Reminder.create({
    userId,
    title: title.trim(),
    description: description || "",
    scheduledAt: new Date(scheduledAt),
    priority: priority || "medium",
    category: category || "general",
  });

  return response("Reminder created successfully", reminder);
};

/**
 * Fetch reminders for the authenticated user.
 * Returns upcoming pending reminders by default.
 *
 * @param {string} userId
 * @param {object} [filters] - { status, limit, includeOverdue }
 * @returns {Promise<object>}
 */
const getReminders = async (userId, filters = {}) => {
  const limit = Math.min(parseInt(filters.limit, 10) || 20, 100);

  // Check for overdue reminders first
  const overdue = await Reminder.overdue(userId);

  // Get upcoming reminders
  const upcoming = await Reminder.upcoming(userId, limit);

  // Optionally include completed
  let completed = [];
  if (filters.status === "completed") {
    completed = await Reminder.find({ userId, status: "completed" })
      .sort({ updatedAt: -1 })
      .limit(limit);
  }

  const data = {
    overdue: overdue || [],
    upcoming: upcoming || [],
    ...(completed.length ? { completed } : {}),
  };

  const total = (overdue?.length || 0) + (upcoming?.length || 0);
  return response(`Found ${total} active reminder(s)`, data);
};

/**
 * Mark a reminder as completed.
 *
 * @param {string} userId
 * @param {object} entities - { reminderId }
 * @returns {Promise<object>}
 */
const completeReminder = async (userId, entities) => {
  const { reminderId } = entities;

  if (!reminderId) {
    throw new ApiError(400, "reminderId is required");
  }

  const reminder = await Reminder.findOneAndUpdate(
    { _id: reminderId, userId },
    { $set: { status: "completed" } },
    { new: true }
  );

  if (!reminder) {
    throw new ApiError(404, "Reminder not found or access denied");
  }

  return response("Reminder marked as completed", reminder);
};

/**
 * Route an intent to the correct reminder action.
 */
const handle = async (intent, userId, entities) => {
  switch (intent) {
    case "add_reminder":
      return addReminder(userId, entities);
    case "get_reminders":
      return getReminders(userId, entities);
    case "complete_reminder":
      return completeReminder(userId, entities);
    default:
      throw new ApiError(400, `Unsupported reminder intent: ${intent}`);
  }
};

module.exports = {
  handle,
  addReminder,
  getReminders,
  completeReminder,
};
