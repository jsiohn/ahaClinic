import mongoose from "mongoose";
import dotenv from "dotenv";
import Invoice from "./src/models/Invoice.js";

dotenv.config();

async function debugInvoices() {
  try {
    const MONGODB_URI =
      process.env.MONGODB_URI || "mongodb://localhost:27017/ahaclinic";
    console.log(
      "🔗 Connecting to MongoDB:",
      MONGODB_URI.replace(/\/\/.*@/, "//***:***@")
    );

    await mongoose.connect(MONGODB_URI);
    console.log("✅ Connected to MongoDB");

    // Count total invoices
    const count = await Invoice.countDocuments();
    console.log(`📊 Total invoices in database: ${count}`);

    if (count === 0) {
      console.log("⚠️ No invoices found in database!");
      return;
    }

    // Get a sample invoice without population
    console.log("\n📋 Sample invoice (raw):");
    const rawInvoice = await Invoice.findOne();
    console.log(JSON.stringify(rawInvoice, null, 2));

    // Get a sample invoice with population
    console.log("\n📋 Sample invoice (populated):");
    const populatedInvoice = await Invoice.findOne()
      .populate("client", "firstName lastName")
      .populate("animalSections.animalId", "name species");
    console.log(JSON.stringify(populatedInvoice, null, 2));

    // Check different invoice data formats
    const oldFormat = await Invoice.countDocuments({
      animal: { $exists: true },
    });
    const arrayFormat = await Invoice.countDocuments({
      animals: { $exists: true },
    });
    const newFormat = await Invoice.countDocuments({
      animalSections: { $exists: true },
    });

    console.log(`\n📈 Invoice formats in database:`);
    console.log(`   - Old format (single animal): ${oldFormat}`);
    console.log(`   - Array format (animals array): ${arrayFormat}`);
    console.log(`   - New format (animalSections): ${newFormat}`);

    // Check for any invoices with empty animalSections
    const emptyAnimals = await Invoice.countDocuments({
      $or: [
        { animalSections: { $size: 0 } },
        { animalSections: { $exists: false } },
      ],
    });
    console.log(`   - Invoices with no animal sections: ${emptyAnimals}`);

    // Check client population issues
    const invalidClients = await Invoice.countDocuments({
      client: { $exists: false },
    });
    console.log(`   - Invoices with no client: ${invalidClients}`);
  } catch (error) {
    console.error("❌ Error:", error.message);
    console.error("Full error:", error);
  } finally {
    await mongoose.disconnect();
    console.log("🔌 Disconnected from MongoDB");
  }
}

debugInvoices();
