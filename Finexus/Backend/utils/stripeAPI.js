/**
 * utils/stripeAPI.js
 * ─────────────────────────────────────────────
 * Helper functions to interact with the Stripe
 * API for creating, fetching, and managing invoices.
 */

const config = require("../config/env");

// Lazy‑initialise Stripe so the module loads even
// without a key (graceful fallback).
let stripe = null;
const getStripe = () => {
  if (!stripe) {
    if (!config.stripeSecretKey) {
      throw new Error("STRIPE_SECRET_KEY is not configured");
    }
    stripe = require("stripe")(config.stripeSecretKey);
  }
  return stripe;
};

// ──────────── Customer helpers ────────────

/**
 * Find or create a Stripe customer for the given email.
 * @param {string} email
 * @param {string} [name]
 * @returns {Promise<string>} Stripe customer ID
 */
const findOrCreateCustomer = async (email, name) => {
  const s = getStripe();

  // Check if the customer already exists
  const existing = await s.customers.list({ email, limit: 1 });
  if (existing.data.length > 0) return existing.data[0].id;

  // Create a new customer
  const customer = await s.customers.create({ email, name });
  return customer.id;
};

// ──────────── Invoice helpers ────────────

/**
 * Create a Stripe invoice with line items and optionally finalise it.
 *
 * @param {object}   params
 * @param {string}   params.customerEmail
 * @param {string}   [params.customerName]
 * @param {Array}    params.items        - [{ description, quantity, unitPrice }]
 * @param {string}   [params.currency='inr']
 * @param {boolean}  [params.autoFinalize=true]
 * @returns {Promise<object>} Stripe Invoice object
 */
const createStripeInvoice = async ({
  customerEmail,
  customerName,
  items = [],
  currency = "inr",
  autoFinalize = true,
}) => {
  try {
    const s = getStripe();

    // 1. Ensure customer exists
    const customerId = await findOrCreateCustomer(customerEmail, customerName);

    // 2. Create a draft invoice
    const invoice = await s.invoices.create({
      customer: customerId,
      currency: currency.toLowerCase(),
      auto_advance: autoFinalize, // automatically finalise after creation
      collection_method: "send_invoice",
      days_until_due: 30,
    });

    // 3. Add line items
    for (const item of items) {
      await s.invoiceItems.create({
        customer: customerId,
        invoice: invoice.id,
        description: item.description,
        quantity: item.quantity || 1,
        unit_amount: Math.round((item.unitPrice || 0) * 100), // Stripe uses cents
        currency: currency.toLowerCase(),
      });
    }

    // 4. Finalise if requested
    let finalized = invoice;
    if (autoFinalize) {
      finalized = await s.invoices.finalizeInvoice(invoice.id);
    }

    return finalized;
  } catch (err) {
    console.error("❌  Stripe createInvoice failed:", err.message);
    throw err;
  }
};

/**
 * Fetch a Stripe invoice by its ID.
 * @param {string} stripeInvoiceId
 * @returns {Promise<object>}
 */
const fetchStripeInvoice = async (stripeInvoiceId) => {
  try {
    const s = getStripe();
    return await s.invoices.retrieve(stripeInvoiceId);
  } catch (err) {
    console.error("❌  Stripe fetchInvoice failed:", err.message);
    throw err;
  }
};

/**
 * Send a finalised Stripe invoice to the customer's email.
 * @param {string} stripeInvoiceId
 * @returns {Promise<object>}
 */
const sendStripeInvoice = async (stripeInvoiceId) => {
  try {
    const s = getStripe();
    return await s.invoices.sendInvoice(stripeInvoiceId);
  } catch (err) {
    console.error("❌  Stripe sendInvoice failed:", err.message);
    throw err;
  }
};

module.exports = {
  findOrCreateCustomer,
  createStripeInvoice,
  fetchStripeInvoice,
  sendStripeInvoice,
};
