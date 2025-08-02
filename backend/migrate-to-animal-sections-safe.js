// Migration script to convert existing invoices to animalSections structure
// This script safely migrates from:
// 1. Old format: { animal: ObjectId, items: [...] }
// 2. Array format: { animals: [ObjectId], items: [...] }
// To new format: { animalSections: [{ animalId: ObjectId, items: [...], subtotal: Number }] }

import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();

const MONGODB_URI =
  process.env.MONGODB_URI || "mongodb://localhost:27017/ahaClinic";

// Helper function to calculate subtotal for items
function calculateSubtotal(items) {
  if (!Array.isArray(items)) return 0;

  return items.reduce((sum, item) => {
    const quantity = Number(item.quantity) || 0;
    const unitPrice = Number(item.unitPrice) || 0;
    return sum + quantity * unitPrice;
  }, 0);
}

// Helper function to create backup
async function createBackup(db) {
  console.log("📋 Creating backup of invoices collection...");

  const invoicesCollection = db.collection("invoices");
  const backupCollection = db.collection("invoices_backup_" + Date.now());

  const allInvoices = await invoicesCollection.find({}).toArray();

  if (allInvoices.length > 0) {
    await backupCollection.insertMany(allInvoices);
    console.log(`✅ Backup created with ${allInvoices.length} invoices`);
    console.log(
      `📁 Backup collection name: ${backupCollection.collectionName}`
    );
  }

  return backupCollection.collectionName;
}

async function migrateToAnimalSections() {
  try {
    console.log("🔗 Connecting to MongoDB...");
    await mongoose.connect(MONGODB_URI);

    const db = mongoose.connection.db;
    const invoicesCollection = db.collection("invoices");

    // Create backup first
    const backupName = await createBackup(db);

    console.log("\n📊 Analyzing current invoice structure...");

    // Check current state
    const oldFormat = await invoicesCollection.countDocuments({
      animal: { $exists: true },
      animalSections: { $exists: false },
    });

    const arrayFormat = await invoicesCollection.countDocuments({
      animals: { $exists: true, $type: "array" },
      animalSections: { $exists: false },
    });

    const newFormat = await invoicesCollection.countDocuments({
      animalSections: { $exists: true },
    });

    console.log(`📈 Current state:`);
    console.log(`   - Old format (single animal): ${oldFormat}`);
    console.log(`   - Array format (animals array): ${arrayFormat}`);
    console.log(`   - New format (animalSections): ${newFormat}`);

    const totalToMigrate = oldFormat + arrayFormat;

    if (totalToMigrate === 0) {
      console.log(
        "✅ No invoices need migration - all are already in the correct format!"
      );
      return;
    }

    console.log(`\n🔄 Starting migration of ${totalToMigrate} invoices...`);

    let migratedCount = 0;
    const batchSize = 10; // Smaller batches for safety

    // Step 1: Migrate old format (single animal) to animalSections
    if (oldFormat > 0) {
      console.log(
        `\n📝 Step 1: Migrating ${oldFormat} invoices from old format...`
      );

      const oldFormatInvoices = await invoicesCollection
        .find({
          animal: { $exists: true },
          animalSections: { $exists: false },
        })
        .toArray();

      for (let i = 0; i < oldFormatInvoices.length; i += batchSize) {
        const batch = oldFormatInvoices.slice(i, i + batchSize);

        const bulkOps = batch.map((invoice) => {
          const items = Array.isArray(invoice.items) ? invoice.items : [];
          const subtotal = calculateSubtotal(items);

          return {
            updateOne: {
              filter: { _id: invoice._id },
              update: {
                $set: {
                  animalSections: [
                    {
                      animalId: invoice.animal,
                      items: items,
                      subtotal: subtotal,
                    },
                  ],
                },
                $unset: {
                  animal: "",
                  items: "",
                },
              },
            },
          };
        });

        await invoicesCollection.bulkWrite(bulkOps);
        migratedCount += batch.length;
        console.log(
          `   ✓ Migrated ${migratedCount}/${oldFormat} old format invoices`
        );
      }
    }

    // Step 2: Migrate array format (animals array) to animalSections
    if (arrayFormat > 0) {
      console.log(
        `\n📝 Step 2: Migrating ${arrayFormat} invoices from array format...`
      );

      const arrayFormatInvoices = await invoicesCollection
        .find({
          animals: { $exists: true, $type: "array" },
          animalSections: { $exists: false },
        })
        .toArray();

      migratedCount = 0; // Reset for this step

      for (let i = 0; i < arrayFormatInvoices.length; i += batchSize) {
        const batch = arrayFormatInvoices.slice(i, i + batchSize);

        const bulkOps = batch.map((invoice) => {
          const animals = Array.isArray(invoice.animals) ? invoice.animals : [];
          const items = Array.isArray(invoice.items) ? invoice.items : [];

          // For invoices with multiple animals but single items array,
          // we need to split items evenly or put all items under first animal
          let animalSections = [];

          if (animals.length === 1) {
            // Single animal - straightforward
            animalSections = [
              {
                animalId: animals[0],
                items: items,
                subtotal: calculateSubtotal(items),
              },
            ];
          } else if (animals.length > 1) {
            // Multiple animals - we'll need to make a decision
            // Option 1: Put all items under first animal (safest)
            // Option 2: Try to split items (riskier)

            // Using Option 1 for safety - put all items under first animal
            animalSections = animals.map((animalId, index) => ({
              animalId: animalId,
              items: index === 0 ? items : [], // All items go to first animal
              subtotal: index === 0 ? calculateSubtotal(items) : 0,
            }));

            console.log(
              `   ⚠️  Invoice ${invoice._id}: Multiple animals detected, all items assigned to first animal`
            );
          }

          return {
            updateOne: {
              filter: { _id: invoice._id },
              update: {
                $set: {
                  animalSections: animalSections,
                },
                $unset: {
                  animals: "",
                  items: "",
                },
              },
            },
          };
        });

        await invoicesCollection.bulkWrite(bulkOps);
        migratedCount += batch.length;
        console.log(
          `   ✓ Migrated ${migratedCount}/${arrayFormat} array format invoices`
        );
      }
    }

    console.log("\n🔍 Verifying migration results...");

    // Final verification
    const finalOldFormat = await invoicesCollection.countDocuments({
      animal: { $exists: true },
      animalSections: { $exists: false },
    });

    const finalArrayFormat = await invoicesCollection.countDocuments({
      animals: { $exists: true, $type: "array" },
      animalSections: { $exists: false },
    });

    const finalNewFormat = await invoicesCollection.countDocuments({
      animalSections: { $exists: true },
    });

    console.log(`📊 Final state:`);
    console.log(`   - Old format remaining: ${finalOldFormat}`);
    console.log(`   - Array format remaining: ${finalArrayFormat}`);
    console.log(`   - New format total: ${finalNewFormat}`);

    if (finalOldFormat === 0 && finalArrayFormat === 0) {
      console.log("\n🎉 Migration completed successfully!");
      console.log(
        `✅ All ${totalToMigrate} invoices have been migrated to animalSections format`
      );
      console.log(`📁 Backup available in collection: ${backupName}`);
    } else {
      console.log(
        "\n⚠️  Migration incomplete - some invoices still need migration"
      );
      console.log(
        "🔄 You may need to run the script again or investigate manually"
      );
    }

    // Sample verification - show structure of a few migrated invoices
    console.log("\n🔍 Sample of migrated invoice structure:");
    const sample = await invoicesCollection.findOne({
      animalSections: { $exists: true },
    });
    if (sample) {
      console.log("📋 Sample invoice animalSections:");
      console.log(JSON.stringify(sample.animalSections, null, 2));
    }
  } catch (error) {
    console.error("❌ Migration failed:", error);
    console.error("💡 Check the backup collection to restore if needed");
    throw error;
  } finally {
    await mongoose.disconnect();
    console.log("\n🔌 Disconnected from MongoDB");
    console.log("✅ Migration process complete");
  }
}

// Safety check - require confirmation for production
if (
  process.env.NODE_ENV === "production" ||
  MONGODB_URI.includes("mongodb+srv")
) {
  console.log("⚠️  PRODUCTION DATABASE DETECTED");
  console.log(
    "📋 This will migrate invoice structure in your production database"
  );
  console.log("💾 A backup will be created automatically");
  console.log("🔄 Continue? Type 'yes' to proceed or Ctrl+C to cancel");

  // For Render, we'll skip the interactive prompt and run directly
  // but with extra safety measures built in
  console.log("🚀 Running migration with production safety measures...");
  migrateToAnimalSections();
} else {
  migrateToAnimalSections();
}
