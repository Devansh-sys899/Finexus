/**
 * models/Invoice.js
 * ─────────────────────────────────────────────
 * Mongoose schema & model for invoices.
 * Stores Stripe invoice reference, line items,
 * amounts, and email delivery status.
 */

const mongoose = require("mongoose");

const lineItemSchema = new mongoose.Schema(
  {
    description: { type: String, required: true, trim: true },
    quantity: { type: Number, required: true, min: 1, default: 1 },
    unitPrice: { type: Number, required: true, min: 0 },
  },
  { _id: false }
);

const invoiceSchema = new mongoose.Schema(
  {
    /** Reference to the owning user */
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "userId is required"],
      index: true,
    },

    /** Human-readable invoice ID (e.g. INV-000123) */
    invoiceId: {
      type: String,
      unique: true,
      required: true,
    },

    /** Client / recipient name */
    client: {
      type: String,
      required: [true, "Client name is required"],
      trim: true,
    },

    /** Client email for delivery */
    clientEmail: {
      type: String,
      required: [true, "Client email is required"],
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, "Please provide a valid email"],
    },

    /** Invoice line items */
    items: {
      type: [lineItemSchema],
      validate: {
        validator: (v) => v.length > 0,
        message: "At least one line item is required",
      },
    },

    /** Total amount (computed from items) */
    amount: {
      type: Number,
      required: true,
      min: [0, "Amount cannot be negative"],
    },

    /** Currency code (ISO 4217) */
    currency: {
      type: String,
      default: "INR",
      uppercase: true,
      maxlength: 3,
    },

    /** Invoice status */
    status: {
      type: String,
      enum: ["draft", "sent", "paid", "cancelled", "overdue"],
      default: "draft",
    },

    /** Optional description / notes */
    description: {
      type: String,
      trim: true,
      maxlength: 1000,
      default: "",
    },

    /** Stripe invoice ID — set after Stripe creation */
    stripeInvoiceId: {
      type: String,
      default: null,
    },

    /** Whether the invoice email has been sent */
    emailSent: {
      type: Boolean,
      default: false,
    },

    /** Due date */
    dueDate: {
      type: Date,
      default: () => new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
    },
  },
  {
    timestamps: true, // createdAt, updatedAt
  }
);

// ──────────── Pre-save: auto-compute amount ────────────
invoiceSchema.pre("save", function () {
  if (this.items && this.items.length) {
    this.amount = this.items.reduce(
      (sum, item) => sum + item.quantity * item.unitPrice,
      0
    );
  }
});

// ──────────── Statics ────────────

/**
 * Generate a unique sequential invoice ID.
 * @returns {Promise<string>} e.g. "INV-000042"
 */
invoiceSchema.statics.generateInvoiceId = async function () {
  const last = await this.findOne().sort({ createdAt: -1 }).select("invoiceId");
  const nextNum = last
    ? parseInt(last.invoiceId.replace("INV-", ""), 10) + 1
    : 1;
  return `INV-${String(nextNum).padStart(6, "0")}`;
};

/**
 * Aggregate invoice totals by status for a user.
 * @param {ObjectId} userId
 */
invoiceSchema.statics.summaryByStatus = function (userId) {
  return this.aggregate([
    { $match: { userId: new mongoose.Types.ObjectId(userId) } },
    {
      $group: {
        _id: "$status",
        count: { $sum: 1 },
        totalAmount: { $sum: "$amount" },
      },
    },
  ]);
};

module.exports = mongoose.model("Invoice", invoiceSchema);
