import mongoose from "mongoose";
import Client from "./src/models/Client.js";
import Animal from "./src/models/Animal.js";

async function createTestData() {
  try {
    await mongoose.connect("mongodb://localhost:27017/ahaClinic");
    console.log("Connected to MongoDB");

    // Check if test client already exists
    const existingClient = await Client.findOne({ email: "test@example.com" });
    if (existingClient) {
      console.log("Test client already exists:", existingClient._id);
      process.exit(0);
    }

    // Create a test client
    const testClient = new Client({
      firstName: "Test",
      lastName: "Owner",
      email: "test@example.com",
      phone: "555-1234",
      address: {
        street: "123 Test St",
        city: "Test City",
        state: "TS",
        zipCode: "12345",
        country: "USA",
      },
    });

    const savedClient = await testClient.save();
    console.log("Created test client:", savedClient._id);

    // Create test animals for this client
    const animals = [
      {
        name: "Buddy",
        species: "DOG",
        breed: "Golden Retriever",
        ageYears: 3,
        weight: 65,
        client: savedClient._id,
      },
      {
        name: "Whiskers",
        species: "CAT",
        breed: "Siamese",
        ageYears: 2,
        weight: 12,
        client: savedClient._id,
      },
    ];

    for (const animalData of animals) {
      const animal = new Animal(animalData);
      const savedAnimal = await animal.save();
      console.log("Created animal:", savedAnimal.name, savedAnimal._id);
    }

    console.log("Test data created successfully!");
    process.exit(0);
  } catch (error) {
    console.error("Error creating test data:", error);
    process.exit(1);
  }
}

createTestData();
