/**
 * models/User.js
 * ─────────────────────────────────────────────
 * Mongoose schema & model for application users.
 * Stores credentials, profile info, and
 * timestamps for audit purposes.
 */

const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const userSchema = new mongoose.Schema(
  {
    /** Full name of the user */
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
      minlength: [2, "Name must be at least 2 characters"],
      maxlength: [100, "Name cannot exceed 100 characters"],
    },

    /** Unique email — used for login and notifications */
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, "Please provide a valid email address"],
    },

    /** Hashed password */
    password: {
      type: String,
      required: [true, "Password is required"],
      minlength: [6, "Password must be at least 6 characters"],
      select: false, // never return password by default
    },

    /** Optional phone number for reminders / 2FA */
    phone: {
      type: String,
      trim: true,
      default: null,
    },

    /** Stripe customer ID — linked after first invoice */
    stripeCustomerId: {
      type: String,
      default: null,
    },

    /** Preferred currency code (ISO 4217) */
    currency: {
      type: String,
      default: "INR",
      uppercase: true,
      maxlength: 3,
    },
  },
  {
    timestamps: true, // createdAt, updatedAt
  }
);

// ──────────── Middleware ────────────

/**
 * Pre-save hook: hash password whenever it is new or modified.
 */
userSchema.pre("save", async function () {
  if (!this.isModified("password")) return;
  this.password = await bcrypt.hash(this.password, 12);
});

// ──────────── Instance methods ────────────

/**
 * Compare a candidate password against the stored hash.
 * @param {string} candidatePassword - Plain text password to check.
 * @returns {Promise<boolean>}
 */
userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

/**
 * Return a safe, serialisable representation (strip password).
 */
userSchema.methods.toSafeObject = function () {
  const obj = this.toObject();
  delete obj.password;
  return obj;
};

module.exports = mongoose.model("User", userSchema);
