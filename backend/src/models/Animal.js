import mongoose from "mongoose";

const animalSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
  },
  species: {
    type: String,
    required: true,
    enum: ["DOG", "CAT", "OTHER"],
    trim: true,
  },
  breed: String,
  age: Number,
  gender: {
    type: String,
    enum: ["male", "female", "unknown"],
    default: "unknown",
  },
  weight: Number,
  client: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Client",
    required: true,
  },
  medicalHistory: [
    {
      date: Date,
      description: String,
      diagnosis: String,
      treatment: String,
      veterinarian: String,
    },
  ],
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

animalSchema.pre("save", function (next) {
  this.updatedAt = Date.now();
  next();
});

const Animal = mongoose.model("Animal", animalSchema);

export default Animal;
