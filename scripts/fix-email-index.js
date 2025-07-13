// Script to fix the email index issue
import mongoose from "mongoose";
import dotenv from "dotenv";

// Load environment variables
dotenv.config();

async function fixEmailIndex() {
  try {
    // Connect to MongoDB
    const mongoUri =
      process.env.MONGODB_URI || "mongodb://localhost:27017/ahaClinic";
    await mongoose.connect(mongoUri);
    console.log("Connected to MongoDB");

    const db = mongoose.connection.db;
    const clientsCollection = db.collection("clients");

    // Check current indexes
    const indexes = await clientsCollection.indexes();
    console.log("Current indexes:");
    indexes.forEach((index, i) => {
      console.log(
        `${i + 1}. ${index.name || "unnamed"}: ${JSON.stringify(index.key)}`
      );
    });

    // Look for email index
    const emailIndex = indexes.find(
      (index) => index.key && index.key.email !== undefined
    );

    if (emailIndex) {
      console.log("\nFound email index:", emailIndex);

      // Drop the problematic email index
      try {
        if (emailIndex.name) {
          await clientsCollection.dropIndex(emailIndex.name);
          console.log(`✓ Dropped index: ${emailIndex.name}`);
        } else if (emailIndex.key) {
          await clientsCollection.dropIndex(emailIndex.key);
          console.log("✓ Dropped email index");
        }
      } catch (indexError) {
        console.log("Index drop error (might be ok):", indexError.message);
      }
    } else {
      console.log("\nNo email index found");
    }

    // Update any empty email strings to null
    const updateResult = await clientsCollection.updateMany(
      { email: "" },
      { $set: { email: null } }
    );
    console.log(
      `\n✓ Updated ${updateResult.modifiedCount} documents with empty email strings`
    );

    // Also update any undefined emails to null
    const updateUndefinedResult = await clientsCollection.updateMany(
      { email: { $exists: false } },
      { $set: { email: null } }
    );
    console.log(
      `✓ Updated ${updateUndefinedResult.modifiedCount} documents with undefined emails`
    );

    // Show final indexes
    const finalIndexes = await clientsCollection.indexes();
    console.log("\nFinal indexes:");
    finalIndexes.forEach((index, i) => {
      console.log(
        `${i + 1}. ${index.name || "unnamed"}: ${JSON.stringify(index.key)}`
      );
    });

    console.log("\n🎉 Fix completed successfully!");
  } catch (error) {
    console.error("❌ Error:", error);
  } finally {
    await mongoose.disconnect();
    console.log("Disconnected from MongoDB");
  }
}

fixEmailIndex();
