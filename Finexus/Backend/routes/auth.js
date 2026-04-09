/**
 * routes/auth.js
 * ─────────────────────────────────────────────
 * Authentication routes: signup, login, and
 * fetching the current user's profile.
 */

const express = require("express");
const router = express.Router();
const { signup, login, getMe } = require("../controllers/authController");
const { protect } = require("../middlewares/authMiddleware");
const { asyncHandler } = require("../utils/errorHandler");

// Public routes
router.post("/signup", asyncHandler(signup));
router.post("/login", asyncHandler(login));

// Protected route — requires valid JWT
router.get("/me", protect, asyncHandler(getMe));

module.exports = router;
