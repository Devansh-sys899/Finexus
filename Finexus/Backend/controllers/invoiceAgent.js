const Invoice = require("../models/Invoice");
const { createStripeInvoice, fetchStripeInvoice } = require("../utils/stripeAPI");
const { sendInvoiceEmail } = require("../utils/emailAPI");
const { ApiError } = require("../utils/errorHandler");

// ──────────── Helpers ────────────

const response = (message, data = null) => ({
  success: true,
  agent: "invoiceAgent",
  message,
  data,
});

const validateInvoiceFields = ({ client, clientEmail, items }) => {
  if (!client) throw new ApiError(400, "Client name is required");
  if (!clientEmail) throw new ApiError(400, "Client email is required");
  if (!items || items.length === 0)
    throw new ApiError(400, "At least one item is required");
};

// ──────────── CREATE INVOICE ────────────

const createInvoice = async (userId, entities) => {
  // 🔥 Normalize LLM → backend
  if (!entities.client && entities.person) {
    entities.client = entities.person;
  }

  if (!entities.items && entities.amount) {
    entities.items = [
      {
        description: entities.description || "Service",
        unitPrice: entities.amount,
        quantity: 1,
      },
    ];
  }

  if (!entities.clientEmail && entities.client) {
    entities.clientEmail = `${entities.client.toLowerCase()}@example.com`;
  }

  const { client, clientEmail, items, description, currency } = entities;

  validateInvoiceFields({ client, clientEmail, items });

  const invoiceId = await Invoice.generateInvoiceId();

  let stripeInvoiceId = null;
  let stripeHostedUrl = null;

  try {
    const stripeInvoice = await createStripeInvoice({
      customerEmail: clientEmail,
      customerName: client,
      items,
      currency: currency || "inr",
    });

    stripeInvoiceId = stripeInvoice.id;
    stripeHostedUrl = stripeInvoice.hosted_invoice_url;
  } catch (err) {
    console.warn("Stripe skipped:", err.message);
  }

  const invoice = await Invoice.create({
    userId,
    invoiceId,
    client,
    clientEmail,
    items,
    amount: items.reduce((sum, i) => sum + i.unitPrice, 0),
    description: description || "",
    currency: currency || "INR",
    stripeInvoiceId,
    status: "draft",
  });

  return response("Invoice created successfully", {
    invoice,
    stripeHostedUrl,
  });
};

// ──────────── GET INVOICES ────────────

const getInvoices = async (userId) => {
  const invoices = await Invoice.find({ userId }).sort({ createdAt: -1 });
  return response(`Found ${invoices.length} invoice(s)`, invoices);
};

// ──────────── SEND INVOICE ────────────

const sendInvoice = async (userId, entities) => {
  const { invoiceId } = entities;

  if (!invoiceId) throw new ApiError(400, "invoiceId required");

  const invoice = await Invoice.findOne({ invoiceId, userId });
  if (!invoice) throw new ApiError(404, "Invoice not found");

  await sendInvoiceEmail({
    to: invoice.clientEmail,
    invoiceId: invoice.invoiceId,
    clientName: invoice.client,
    amount: invoice.amount,
  });

  invoice.status = "sent";
  await invoice.save();

  return response("Invoice sent successfully", invoice);
};

// ──────────── ROUTER ────────────

const handle = async (intent, userId, entities) => {
  switch (intent) {
    case "create_invoice":
      return createInvoice(userId, entities);
    case "get_invoices":
      return getInvoices(userId);
    case "send_invoice":
      return sendInvoice(userId, entities);
    default:
      throw new ApiError(400, "Invalid invoice intent");
  }
};

// ✅ EXPORT (VERY IMPORTANT)
module.exports = {
  handle,
  createInvoice,
  getInvoices,
  sendInvoice,
};