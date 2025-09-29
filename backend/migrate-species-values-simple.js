// Simple migration script - run with: node migrate-species-values-simple.js

import { MongoClient } from "mongodb";

async function migrateSpecies() {
  const uri = process.env.MONGODB_URI || "mongodb://localhost:27017/ahaClinic";
  const client = new MongoClient(uri);

  try {
    await client.connect();
    console.log("Connected to MongoDB");

    const db = client.db();
    const collection = db.collection("animals");

    // Check current state
    const totalCount = await collection.countDocuments();
    const dogCount = await collection.countDocuments({ species: "DOG" });
    const catCount = await collection.countDocuments({ species: "CAT" });
    const canineCount = await collection.countDocuments({ species: "CANINE" });
    const felineCount = await collection.countDocuments({ species: "FELINE" });

    console.log("\n=== CURRENT STATE ===");
    console.log(`Total animals: ${totalCount}`);
    console.log(`DOG: ${dogCount}`);
    console.log(`CAT: ${catCount}`);
    console.log(`CANINE: ${canineCount}`);
    console.log(`FELINE: ${felineCount}`);

    if (dogCount === 0 && catCount === 0) {
      console.log("\n✅ No migration needed - all species already updated");
      return;
    }

    console.log("\n=== STARTING MIGRATION ===");

    // Update DOG to CANINE
    const dogResult = await collection.updateMany(
      { species: "DOG" },
      { $set: { species: "CANINE" } }
    );
    console.log(`Updated ${dogResult.modifiedCount} DOG records to CANINE`);

    // Update CAT to FELINE
    const catResult = await collection.updateMany(
      { species: "CAT" },
      { $set: { species: "FELINE" } }
    );
    console.log(`Updated ${catResult.modifiedCount} CAT records to FELINE`);

    // Verify results
    const newDogCount = await collection.countDocuments({ species: "DOG" });
    const newCatCount = await collection.countDocuments({ species: "CAT" });
    const newCanineCount = await collection.countDocuments({
      species: "CANINE",
    });
    const newFelineCount = await collection.countDocuments({
      species: "FELINE",
    });

    console.log("\n=== FINAL STATE ===");
    console.log(`DOG: ${newDogCount}`);
    console.log(`CAT: ${newCatCount}`);
    console.log(`CANINE: ${newCanineCount}`);
    console.log(`FELINE: ${newFelineCount}`);

    console.log("\n✅ Migration completed!");
  } catch (error) {
    console.error("❌ Migration failed:", error);
  } finally {
    await client.close();
  }
}

migrateSpecies();
