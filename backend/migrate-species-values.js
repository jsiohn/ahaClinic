import mongoose from "mongoose";
import Animal from "./src/models/Animal.js";

// Migration script to update species values from DOG/CAT to CANINE/FELINE

async function migrateSpeciesValues() {
  try {
    // Connect to MongoDB
    const mongoUri =
      process.env.MONGODB_URI || "mongodb://localhost:27017/ahaClinic";
    await mongoose.connect(mongoUri);
    console.log("✅ Connected to MongoDB");

    // Get count of animals before migration
    const totalAnimals = await Animal.countDocuments();
    console.log(`📊 Total animals in database: ${totalAnimals}`);

    const dogsCount = await Animal.countDocuments({ species: "DOG" });
    const catsCount = await Animal.countDocuments({ species: "CAT" });

    console.log(`🐕 Animals with species "DOG": ${dogsCount}`);
    console.log(`🐱 Animals with species "CAT": ${catsCount}`);

    if (dogsCount === 0 && catsCount === 0) {
      console.log(
        "✅ No animals found with old species values. Migration not needed."
      );
      return;
    }

    console.log("🔄 Starting migration...");

    // Update DOG to CANINE
    if (dogsCount > 0) {
      const dogResult = await Animal.updateMany(
        { species: "DOG" },
        { $set: { species: "CANINE" } }
      );
      console.log(
        `✅ Updated ${dogResult.modifiedCount} animals from "DOG" to "CANINE"`
      );
    }

    // Update CAT to FELINE
    if (catsCount > 0) {
      const catResult = await Animal.updateMany(
        { species: "CAT" },
        { $set: { species: "FELINE" } }
      );
      console.log(
        `✅ Updated ${catResult.modifiedCount} animals from "CAT" to "FELINE"`
      );
    }

    // Verify the migration
    const newCanineCount = await Animal.countDocuments({ species: "CANINE" });
    const newFelineCount = await Animal.countDocuments({ species: "FELINE" });
    const remainingDogsCount = await Animal.countDocuments({ species: "DOG" });
    const remainingCatsCount = await Animal.countDocuments({ species: "CAT" });

    console.log("\n📊 Post-migration counts:");
    console.log(`🐕 Animals with species "CANINE": ${newCanineCount}`);
    console.log(`🐱 Animals with species "FELINE": ${newFelineCount}`);
    console.log(`❌ Remaining "DOG" entries: ${remainingDogsCount}`);
    console.log(`❌ Remaining "CAT" entries: ${remainingCatsCount}`);

    if (remainingDogsCount === 0 && remainingCatsCount === 0) {
      console.log("✅ Migration completed successfully!");
    } else {
      console.log("⚠️  Warning: Some records were not migrated properly.");
    }
  } catch (error) {
    console.error("❌ Error during migration:", error);
    throw error;
  } finally {
    await mongoose.disconnect();
    console.log("🔌 Disconnected from MongoDB");
  }
}

// Run the migration
if (process.argv[1] === new URL(import.meta.url).pathname) {
  migrateSpeciesValues()
    .then(() => {
      console.log("🎉 Migration script completed");
      process.exit(0);
    })
    .catch((error) => {
      console.error("💥 Migration failed:", error);
      process.exit(1);
    });
}

export default migrateSpeciesValues;
