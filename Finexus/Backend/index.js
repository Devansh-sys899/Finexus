/**
 * index.js — Finexus Backend Entry Point
 * ─────────────────────────────────────────────
 * Initialises Express, connects to MongoDB,
 * mounts all routes and middleware, and starts
 * the HTTP server with graceful shutdown support.
 */

// ── 1. Load environment first ──
const config = require("./config/env");

// ── 2. Dependencies ──
const express = require("express");
const cors = require("cors");
const cookieParser = require('cookie-parser');
const { connectDB, disconnectDB } = require("./config/db");
const { errorHandler } = require("./utils/errorHandler");

// ── 3. Route imports ──
const webhookRoutes = require("./routes/webhook");
const authRoutes = require("./routes/auth");
const expenseRoutes = require("./routes/expenses");
const invoiceRoutes = require("./routes/invoices");
const analyticsRoutes = require("./routes/analytics");
const reminderRoutes = require("./routes/reminders");

// ── 4. Express app ──
const app = express();

// ── 5. Global middleware ──
app.use(cors({
  origin: ['https://finexus-delta.vercel.app', 'https://finexus-yr5d7v1j7-dishanahar791-7222s-projects.vercel.app'],
  credentials: true
}));

app.use(cookieParser());
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));

// ── 6. Health check ──
app.get("/", (_req, res) => {
  res.json({
    success: true,
    message: "Finexus API is running 🚀",
    version: "1.0.0",
    environment: config.nodeEnv,
  });
});

app.get("/health", (_req, res) => {
  res.json({ status: "ok", uptime: process.uptime() });
});

// ── 7. API Routes ──
app.use("/api/webhook", webhookRoutes);      // Chat / conversational AI endpoint
app.use("/api/auth", authRoutes);            // Signup / Login / Me
app.use("/api/expenses", expenseRoutes);     // REST: Expenses CRUD
app.use("/api/invoices", invoiceRoutes);     // REST: Invoices
app.use("/api/analytics", analyticsRoutes);  // REST: Analytics
app.use("/api/reminders", reminderRoutes);   // REST: Reminders

// ── 8. 404 handler — must come AFTER all routes ──
app.use((_req, res) => {
  res.status(404).json({
    success: false,
    error: { message: "Route not found" },
  });
});

// ── 9. Global error handler — must be LAST middleware ──
app.use(errorHandler);

// ── 10. Start server ──
const PORT = config.port;

const startServer = async () => {
  try {
    // Connect to MongoDB
    await connectDB();

    // Start listening
    const server = app.listen(PORT, () => {
      console.log(`\n🚀  Finexus API listening on port ${PORT} (${config.nodeEnv})\n`);
    });

    // ── Graceful shutdown ──
    const shutdown = async (signal) => {
      console.log(`\n${signal} received — shutting down gracefully...`);
      server.close(async () => {
        await disconnectDB();
        console.log("👋  Server closed");
        process.exit(0);
      });
    };

    process.on("SIGINT", () => shutdown("SIGINT"));
    process.on("SIGTERM", () => shutdown("SIGTERM"));
  } catch (err) {
    console.error("🛑  Failed to start server:", err);
    process.exit(1);
  }
};

startServer();

module.exports = app; // Export for testing
