/**
 * routes/invoices.js
 * ─────────────────────────────────────────────
 * RESTful routes for direct invoice management.
 */

const express = require("express");
const router = express.Router();
const { protect } = require("../middlewares/authMiddleware");
const { asyncHandler } = require("../utils/errorHandler");
const invoiceAgent = require("../controllers/invoiceAgent");

/**
 * GET /api/invoices
 * List invoices for the authenticated user.
 * Query params: status, limit
 */
router.get(
  "/",
  protect,
  asyncHandler(async (req, res) => {
    const result = await invoiceAgent.getInvoices(req.user.id, req.query);
    res.json(result);
  })
);

/**
 * POST /api/invoices
 * Create a new invoice.
 */
router.post(
  "/",
  protect,
  asyncHandler(async (req, res) => {
    const result = await invoiceAgent.createInvoice(req.user.id, req.body);
    res.status(201).json(result);
  })
);

/**
 * POST /api/invoices/:invoiceId/send
 * Send an invoice via email.
 */
router.post(
  "/:invoiceId/send",
  protect,
  asyncHandler(async (req, res) => {
    const result = await invoiceAgent.sendInvoice(req.user.id, {
      invoiceId: req.params.invoiceId,
    });
    res.json(result);
  })
);

module.exports = router;
