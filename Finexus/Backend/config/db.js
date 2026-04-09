/**
 * config/db.js
 * ─────────────────────────────────────────────
 * Establishes and manages the MongoDB connection
 * using Mongoose. Includes retry logic and
 * graceful‑shutdown handling.
 */

const mongoose = require("mongoose");
const config = require("./env");

/**
 * Connect to MongoDB.
 * Retries up to `maxRetries` times with a 5‑second delay between attempts.
 */
const connectDB = async (maxRetries = 5) => {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      await mongoose.connect(config.mongoUri);
      console.log(`✅  MongoDB connected (attempt ${attempt})`);

      // Connection event listeners
      mongoose.connection.on("error", (err) => {
        console.error("❌  MongoDB connection error:", err.message);
      });

      mongoose.connection.on("disconnected", () => {
        console.warn("⚠️  MongoDB disconnected");
      });

      return; // success — exit the loop
    } catch (err) {
      console.error(
        `❌  MongoDB connection attempt ${attempt}/${maxRetries} failed:`,
        err.message
      );

      if (attempt === maxRetries) {
        console.error("🛑  All MongoDB connection attempts exhausted. Exiting.");
        process.exit(1);
      }

      // Wait 5 seconds before retrying
      await new Promise((resolve) => setTimeout(resolve, 5000));
    }
  }
};

/**
 * Gracefully close the MongoDB connection.
 * Called on process termination signals.
 */
const disconnectDB = async () => {
  try {
    await mongoose.connection.close();
    console.log("🔌  MongoDB connection closed gracefully");
  } catch (err) {
    console.error("❌  Error closing MongoDB connection:", err.message);
  }
};

module.exports = { connectDB, disconnectDB };