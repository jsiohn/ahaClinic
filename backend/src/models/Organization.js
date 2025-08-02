import mongoose from "mongoose";

const organizationSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
  },
  contactPerson: {
    type: String,
    trim: true,
  },
  address: {
    street: String,
    city: String,
    state: String,
    zipCode: String,
    country: String,
  },
  contactInfo: {
    phone: String,
    email: String,
    website: String,
  },
  status: {
    type: String,
    enum: ["ACTIVE", "INACTIVE", "PENDING"],
    default: "PENDING",
  },
  notes: {
    type: String,
    trim: true,
  },
  taxId: String,
  businessHours: {
    monday: { open: String, close: String },
    tuesday: { open: String, close: String },
    wednesday: { open: String, close: String },
    thursday: { open: String, close: String },
    friday: { open: String, close: String },
    saturday: { open: String, close: String },
    sunday: { open: String, close: String },
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

organizationSchema.pre("save", function (next) {
  this.updatedAt = Date.now();
  next();
});

// Add indexes for better query performance
organizationSchema.index({ name: 1 });
organizationSchema.index({ contactEmail: 1 });
organizationSchema.index({ contactPhone: 1 });

const Organization = mongoose.model("Organization", organizationSchema);

export default Organization;
