// Script to fix existing empty email strings in the database
// This should be run once to clean up existing data

import mongoose from "mongoose";
import Client from "./backend/src/models/Client.js";

async function fixEmptyEmails() {
  try {
    // Connect to MongoDB (adjust connection string as needed)
    await mongoose.connect(
      process.env.MONGODB_URI || "mongodb://localhost:27017/ahaClinic"
    );

    console.log("Connected to MongoDB");

    // Find all clients with empty string emails
    const clientsWithEmptyEmails = await Client.find({ email: "" });
    console.log(
      `Found ${clientsWithEmptyEmails.length} clients with empty email strings`
    );

    // Update empty email strings to null
    const result = await Client.updateMany(
      { email: "" },
      { $set: { email: null } }
    );

    console.log(`Updated ${result.modifiedCount} clients`);

    // Optionally, you can also remove the unique index if it exists
    // Be careful with this - only run if you're sure
    // await Client.collection.dropIndex("email_1");
    // console.log('Dropped email unique index');

    mongoose.disconnect();
    console.log("Done!");
  } catch (error) {
    console.error("Error:", error);
    mongoose.disconnect();
  }
}

fixEmptyEmails();
