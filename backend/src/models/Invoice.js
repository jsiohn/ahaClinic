import mongoose from "mongoose";

const invoiceItemSchema = new mongoose.Schema({
  description: {
    type: String,
    required: true,
  },
  quantity: {
    type: Number,
    required: true,
    min: 1,
  },
  unitPrice: {
    type: Number,
    required: true,
    min: 0,
  },
  total: {
    type: Number,
    required: true,
  },
});

const invoiceSchema = new mongoose.Schema({
  invoiceNumber: {
    type: String,
    required: true,
    unique: true,
  },
  client: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Client",
    required: true,
  },
  animal: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Animal",
    required: true,
  },
  date: {
    type: Date,
    required: true,
    default: Date.now,
  },
  dueDate: {
    type: Date,
    required: true,
  },
  items: [invoiceItemSchema],
  subtotal: {
    type: Number,
    required: true,
  },
  tax: {
    type: Number,
    required: true,
    default: 0,
  },
  total: {
    type: Number,
    required: true,
  },
  status: {
    type: String,
    enum: ["draft", "sent", "paid", "overdue", "cancelled"],
    default: "draft",
  },
  paymentMethod: {
    type: String,
    enum: ["cash", "credit_card", "bank_transfer", "check", null],
    default: null,
  },
  paymentDate: Date,
  notes: String,
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

invoiceSchema.pre("save", function (next) {
  this.updatedAt = Date.now();
  next();
});

const Invoice = mongoose.model("Invoice", invoiceSchema);

export default Invoice;
