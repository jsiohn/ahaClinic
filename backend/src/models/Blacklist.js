import mongoose from "mongoose";

const blacklistSchema = new mongoose.Schema({
  client: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Client",
    required: true,
  },
  reason: {
    type: String,
    required: true,
  },
  addedBy: {
    type: String,
    required: true,
  },
  notes: String,
  isActive: {
    type: Boolean,
    default: true,
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

blacklistSchema.pre("save", function (next) {
  this.updatedAt = Date.now();
  next();
});

const Blacklist = mongoose.model("Blacklist", blacklistSchema);

export default Blacklist;
