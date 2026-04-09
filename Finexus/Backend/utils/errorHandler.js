/**
 * utils/errorHandler.js
 * ─────────────────────────────────────────────
 * Centralised Express error‑handling middleware.
 * Catches all errors thrown / passed via next()
 * and returns a consistent JSON envelope.
 */

/**
 * Standard API error class.
 * Throw this in controllers / services
 * to return a specific HTTP status and message.
 */
class ApiError extends Error {
  /**
   * @param {number} statusCode - HTTP status code
   * @param {string} message    - User‑facing message
   * @param {object} [details]  - Optional extra info (validation errors, etc.)
   */
  constructor(statusCode, message, details = null) {
    super(message);
    this.name = "ApiError";
    this.statusCode = statusCode;
    this.details = details;
  }
}

/**
 * Express error‑handling middleware (4‑arg signature).
 * Mount as the LAST middleware in the pipeline.
 */
const errorHandler = (err, _req, res, _next) => {
  // Default to 500 if no status was set
  const statusCode = err.statusCode || 500;

  // Build the response payload
  const payload = {
    success: false,
    error: {
      message: err.message || "Internal server error",
      ...(err.details ? { details: err.details } : {}),
    },
  };

  // In development, include the stack trace for debugging
  if (process.env.NODE_ENV !== "production") {
    payload.error.stack = err.stack;
  }

  // Mongoose validation errors → 400
  if (err.name === "ValidationError") {
    payload.error.message = "Validation failed";
    payload.error.details = Object.values(err.errors).map((e) => ({
      field: e.path,
      message: e.message,
    }));
    return res.status(400).json(payload);
  }

  // Mongoose duplicate key → 409
  if (err.code === 11000) {
    const field = Object.keys(err.keyPattern || {})[0] || "field";
    payload.error.message = `Duplicate value for '${field}'`;
    return res.status(409).json(payload);
  }

  // Mongoose cast error (invalid ObjectId, etc.) → 400
  if (err.name === "CastError") {
    payload.error.message = `Invalid value for ${err.path}: ${err.value}`;
    return res.status(400).json(payload);
  }

  // JWT errors
  if (err.name === "JsonWebTokenError") {
    payload.error.message = "Invalid authentication token";
    return res.status(401).json(payload);
  }
  if (err.name === "TokenExpiredError") {
    payload.error.message = "Authentication token has expired";
    return res.status(401).json(payload);
  }

  // Log 5xx errors server‑side
  if (statusCode >= 500) {
    console.error("🔥  Server error:", err);
  }

  return res.status(statusCode).json(payload);
};

/**
 * Wrap an async route handler so thrown errors are
 * automatically forwarded to the error middleware.
 *
 * Usage:
 *   router.get("/foo", asyncHandler(async (req, res) => { ... }));
 *
 * @param {Function} fn - Async Express handler
 * @returns {Function}
 */
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

module.exports = { ApiError, errorHandler, asyncHandler };
