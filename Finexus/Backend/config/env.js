/**
 * config/env.js
 * ─────────────────────────────────────────────
 * Loads environment variables from .env and
 * exports them as a frozen configuration object.
 * Throws on startup if critical variables are missing.
 */

const dotenv = require("dotenv");
const path = require("path");

// Load .env from project root
dotenv.config({ path: path.resolve(__dirname, "../.env") });

// List of variables that MUST be present
const REQUIRED = ["MONGO_URI"];

const missing = REQUIRED.filter((key) => !process.env[key]);
if (missing.length) {
  console.error(`❌  Missing required env vars: ${missing.join(", ")}`);
  process.exit(1);
}

/** Frozen config object — import this instead of reading process.env directly */
const config = Object.freeze({
  // Server
  port: parseInt(process.env.PORT, 10) || 3000,
  nodeEnv: process.env.NODE_ENV || "development",

  // MongoDB
  mongoUri: process.env.MONGO_URI,

  // JWT
  jwtSecret: process.env.JWT_SECRET || "fallback_secret_change_me",
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || "7d",

  // Google Gemini
  geminiApiKey: process.env.GEMINI_API_KEY || "",

  // Stripe
  stripeSecretKey: process.env.STRIPE_SECRET_KEY || "",

  // Email
  email: {
    host: process.env.EMAIL_HOST || "smtp.gmail.com",
    port: parseInt(process.env.EMAIL_PORT, 10) || 587,
    user: process.env.EMAIL_USER || "",
    pass: process.env.EMAIL_PASS || "",
    from: process.env.EMAIL_FROM || "Finexus <noreply@finexus.app>",
  },
});

module.exports = config;
