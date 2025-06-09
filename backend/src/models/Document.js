import mongoose from "mongoose";

// Define a schema for document versions
const versionSchema = new mongoose.Schema({
  fileData: {
    type: Buffer,
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: false,
  },
  notes: {
    type: String,
    trim: true,
  },
});

const documentSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
  },
  description: {
    type: String,
    trim: true,
  },
  fileType: {
    type: String,
    required: true,
    enum: ["PDF", "IMAGE", "OTHER"],
    default: "PDF",
  },
  fileData: {
    type: Buffer,
    required: true,
  },
  animal: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Animal",
    required: false,
  },
  client: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Client",
    required: false,
  },
  organization: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Organization",
    required: false,
  },
  isEditable: {
    type: Boolean,
    default: true,
  },
  isPrintable: {
    type: Boolean,
    default: true,
  },
  versions: [versionSchema],
  currentVersion: {
    type: Number,
    default: 1,
  },
  sharedWith: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  ],
  isShared: {
    type: Boolean,
    default: false,
  },
  shareLink: {
    type: String,
    default: null,
  },
  shareLinkExpiry: {
    type: Date,
    default: null,
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

// Update the updatedAt field on every save
documentSchema.pre("save", function (next) {
  this.updatedAt = Date.now();
  next();
});

const Document = mongoose.model("Document", documentSchema);

export default Document;
