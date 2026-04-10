/**
 * controllers/authController.js
 * ─────────────────────────────────────────────
 * Handles user registration (signup) and
 * authentication (login). Issues JWTs on success.
 */

const jwt = require("jsonwebtoken");
const User = require("../models/User");
const config = require("../config/env");
const { ApiError } = require("../utils/errorHandler");

/**
 * Generate a signed JWT for the given user.
 * @param {object} user - Mongoose User document
 * @returns {string}
 */
const signToken = (user) =>
  jwt.sign(
    { id: user._id, email: user.email },
    config.jwtSecret,
    { expiresIn: config.jwtExpiresIn }
  );

// ──────────── Signup ────────────

/**
 * POST /api/auth/signup
 * Register a new user.
 */
exports.signup = async (req, res, next) => {
  try {
    const { name, email, password } = req.body;

    // Validate input
    if (!name || !email || !password) {
      throw new ApiError(400, "Name, email, and password are required");
    }

    if (password.length < 6) {
      throw new ApiError(400, "Password must be at least 6 characters");
    }

    // Check for existing user
    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) {
      throw new ApiError(409, "A user with this email already exists");
    }

    // Create user (password hashed in pre‑save hook)
    const user = await User.create({ name, email, password });

    // Issue token
    const token = signToken(user);
    
    res.cookie('token', token, {
      httpOnly: true,
      secure: true,
      sameSite: "None"
    });

    res.status(201).json({
      success: true,
      message: "User registered successfully",
      data: {
        token,
        user: user.toSafeObject(),
      },
    });
  } catch (err) {
    next(err);
  }
};

// ──────────── Login ────────────

/**
 * POST /api/auth/login
 * Authenticate an existing user.
 */
exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      throw new ApiError(400, "Email and password are required");
    }

    // Find user and explicitly select the password field
    const user = await User.findOne({ email: email.toLowerCase() }).select(
      "+password"
    );

    if (!user) {
      throw new ApiError(401, "Invalid email or password");
    }

    // Verify password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      throw new ApiError(401, "Invalid email or password");
    }

    // Issue token
    const token = signToken(user);

    res.cookie('token', token, {
      httpOnly: true,
      secure: true,
      sameSite: "None"
    });

    res.json({
      success: true,
      message: "Login successful",
      data: {
        token,
        user: user.toSafeObject(),
      },
    });
  } catch (err) {
    next(err);
  }
};

// ──────────── Get current user ────────────

/**
 * GET /api/auth/me
 * Return the currently authenticated user's profile.
 * Requires auth middleware.
 */
exports.getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      throw new ApiError(404, "User not found");
    }

    res.json({
      success: true,
      data: user.toSafeObject(),
    });
  } catch (err) {
    next(err);
  }
};
