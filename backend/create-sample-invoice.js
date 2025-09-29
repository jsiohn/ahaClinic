import mongoose from "mongoose";
import dotenv from "dotenv";
import Invoice from "./src/models/Invoice.js";
import Client from "./src/models/Client.js";
import Animal from "./src/models/Animal.js";

dotenv.config();

async function createSampleInvoice() {
  try {
    const MONGODB_URI =
      process.env.MONGODB_URI || "mongodb://localhost:27017/ahaclinic";
    console.log("🔗 Connecting to MongoDB...");

    await mongoose.connect(MONGODB_URI);
    console.log("✅ Connected to MongoDB");

    // Find or create a test client
    let client = await Client.findOne({ email: "test@example.com" });
    if (!client) {
      console.log("📝 Creating test client...");
      client = await Client.create({
        firstName: "John",
        lastName: "Doe",
        email: "test@example.com",
        phone: "555-1234",
        address: {
          street: "123 Main St",
          city: "Test City",
          state: "TS",
          zipCode: "12345",
          country: "USA",
        },
      });
      console.log("✅ Created test client:", client._id);
    } else {
      console.log("✅ Found existing test client:", client._id);
    }

    // Find or create a test animal
    let animal = await Animal.findOne({ client: client._id });
    if (!animal) {
      console.log("🐕 Creating test animal...");
      animal = await Animal.create({
        name: "Buddy",
        species: "CANINE",
        breed: "Golden Retriever",
        ageYears: 3,
        weight: 65,
        client: client._id,
      });
      console.log("✅ Created test animal:", animal._id);
    } else {
      console.log("✅ Found existing test animal:", animal._id);
    }

    // Check if invoice already exists
    const existingInvoice = await Invoice.findOne({
      client: client._id,
      invoiceNumber: "INV-001",
    });

    if (existingInvoice) {
      console.log("ℹ️ Test invoice already exists:", existingInvoice._id);
      return;
    }

    // Create a sample invoice
    console.log("📋 Creating sample invoice...");
    const invoice = await Invoice.create({
      invoiceNumber: "INV-001",
      client: client._id,
      date: new Date(),
      dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
      animalSections: [
        {
          animalId: animal._id,
          items: [
            {
              description: "Annual Wellness Exam",
              procedure: "EXAM",
              quantity: 1,
              unitPrice: 75.0,
              total: 75.0,
            },
            {
              description: "Rabies Vaccination",
              procedure: "VAX",
              quantity: 1,
              unitPrice: 25.0,
              total: 25.0,
            },
          ],
          subtotal: 100.0,
        },
      ],
      subtotal: 100.0,
      total: 100.0,
      status: "draft",
      notes: "Annual checkup and vaccinations completed successfully.",
    });

    console.log("✅ Created sample invoice:", invoice._id);
    console.log("📋 Invoice Number:", invoice.invoiceNumber);
    console.log("💰 Total:", `$${invoice.total}`);
  } catch (error) {
    console.error("❌ Error:", error.message);
    console.error("Full error:", error);
  } finally {
    await mongoose.disconnect();
    console.log("🔌 Disconnected from MongoDB");
  }
}

createSampleInvoice();
