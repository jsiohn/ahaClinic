import mongoose from "mongoose";

const clientSchema = new mongoose.Schema({
  firstName: {
    type: String,
    required: true,
    trim: true,
  },
  lastName: {
    type: String,
    required: true,
    trim: true,
  },
  email: {
    type: String,
    required: false,
    unique: false,
    trim: true,
    lowercase: true,
    sparse: true, // Only enforces uniqueness for non-null values
  },
  phone: {
    type: String,
    required: true,
  },
  address: {
    street: String,
    city: String,
    state: String,
    zipCode: String,
    country: String,
    county: String,
  },
  notes: String,
  isActive: {
    type: Boolean,
    default: true,
  },
  // Blacklist functionality - stores blacklist status directly on client
  isBlacklisted: {
    type: Boolean,
    default: false,
  },
  blacklistReason: String,
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

clientSchema.pre("save", function (next) {
  this.updatedAt = Date.now();
  next();
});

// Add indexes for better query performance
// Note: email already has sparse index defined in schema
clientSchema.index({ firstName: 1, lastName: 1 });
clientSchema.index({ isActive: 1 });
clientSchema.index({ isBlacklisted: 1 });
clientSchema.index({ isActive: 1, isBlacklisted: 1 });

const Client = mongoose.model("Client", clientSchema);

export default Client;
