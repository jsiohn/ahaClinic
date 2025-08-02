// Migration script to convert existing invoices from single animal to animals array
import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/ahaClinic';

async function migrateInvoiceAnimals() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    
    const db = mongoose.connection.db;
    const invoicesCollection = db.collection('invoices');
    
    console.log('Finding invoices with single animal field...');
    const invoicesWithSingleAnimal = await invoicesCollection.find({ 
      animal: { $exists: true },
      animals: { $exists: false }
    }).toArray();
    
    console.log(`Found ${invoicesWithSingleAnimal.length} invoices to migrate`);
    
    if (invoicesWithSingleAnimal.length === 0) {
      console.log('No invoices to migrate');
      return;
    }
    
    // Process invoices in batches
    const batchSize = 50;
    let migratedCount = 0;
    
    for (let i = 0; i < invoicesWithSingleAnimal.length; i += batchSize) {
      const batch = invoicesWithSingleAnimal.slice(i, i + batchSize);
      
      const bulkOps = batch.map(invoice => ({
        updateOne: {
          filter: { _id: invoice._id },
          update: {
            $set: { 
              animals: [invoice.animal] // Convert single animal to array
            },
            $unset: { 
              animal: "" // Remove the old animal field
            }
          }
        }
      }));
      
      await invoicesCollection.bulkWrite(bulkOps);
      migratedCount += batch.length;
      console.log(`Migrated ${migratedCount}/${invoicesWithSingleAnimal.length} invoices`);
    }
    
    console.log('✅ Migration completed successfully!');
    console.log(`Total invoices migrated: ${migratedCount}`);
    
    // Verify migration
    const remainingOldFormat = await invoicesCollection.countDocuments({ 
      animal: { $exists: true },
      animals: { $exists: false }
    });
    
    const newFormat = await invoicesCollection.countDocuments({ 
      animals: { $exists: true, $type: 'array' }
    });
    
    console.log(`Verification:`);
    console.log(`- Invoices still in old format: ${remainingOldFormat}`);
    console.log(`- Invoices in new format: ${newFormat}`);
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

migrateInvoiceAnimals();
