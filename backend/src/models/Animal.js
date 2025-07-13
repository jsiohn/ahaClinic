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
  age: Number, // Keep for backward compatibility
  ageYears: {
    type: Number,
    min: 0,
    max: 50,
  },
  ageMonths: {
    type: Number,
    min: 0,
    max: 11,
  },
  gender: {
    type: String,
    enum: ["male", "female", "unknown"],
    default: "unknown",
  },
  weight: Number,
  microchipNumber: String,
  dateOfBirth: {
    type: Date,
    required: false,
  },
  isSpayedNeutered: {
    type: Boolean,
    default: false,
  },
  spayNeuterDate: {
    type: Date,
    required: false,
  },
  color: String,
  vaccineDate: Date,
  nextVaccineDate: Date,
  tagNumber: String,
  vaccineSerial: String,
  lotExpiration: Date,
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
  medicalHistory: [
    {
      date: Date,
      procedure: String,
      notes: String,
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
