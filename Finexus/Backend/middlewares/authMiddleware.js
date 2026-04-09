/**
 * middlewares/authMiddleware.js
 * ─────────────────────────────────────────────
 * JWT authentication middleware.
 * Extracts the token from the Authorization header,
 * verifies it, and attaches the decoded payload
 * to `req.user` for downstream handlers.
 */

const jwt = require("jsonwebtoken");
const config = require("../config/env");
const User = require("../models/User");
const { ApiError } = require("../utils/errorHandler");

/**
 * Protect routes — requires a valid Bearer token.
 */
const protect = async (req, _res, next) => {
  try {
    let token = req.cookies.token;

    if (!token) {
      throw new ApiError(401, "Authentication required — no token provided");
    }

    // Verify token
    const decoded = jwt.verify(token, config.jwtSecret);

    // Confirm the user still exists
    const user = await User.findById(decoded.id);
    if (!user) {
      throw new ApiError(401, "The user for this token no longer exists");
    }

    // Attach user payload for downstream use
    req.user = { id: decoded.id, email: decoded.email };
    next();
  } catch (err) {
    if (err instanceof ApiError) return next(err);

    // JWT‑specific errors are handled by the global error handler
    next(err);
  }
};

module.exports = { protect };