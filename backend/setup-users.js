// Create initial admin user for testing
import mongoose from "mongoose";
import dotenv from "dotenv";

// Load environment variables
dotenv.config();

// Import User model
import User from "./src/models/User.js";

async function createInitialAdmin() {
  try {
    console.log("🔧 Setting up initial admin user...\n");

    // Connect to MongoDB
    const MONGODB_URI =
      process.env.MONGODB_URI || "mongodb://localhost:27017/ahaclinic";
    await mongoose.connect(MONGODB_URI);
    console.log("✅ Connected to MongoDB");

    // Check if admin already exists
    const existingAdmin = await User.findOne({ role: "admin" });
    if (existingAdmin) {
      console.log("👤 Admin user already exists:", existingAdmin.username);
      await mongoose.disconnect();
      return;
    }

    // Create admin user
    const adminUser = new User({
      username: "admin",
      email: "admin@ahaclinic.com",
      password: "admin123", // This will be hashed automatically
      role: "admin",
      mustChangePassword: false, // Admin doesn't need to change password
    });

    await adminUser.save();
    console.log("✅ Admin user created successfully!");
    console.log("📝 Username: admin");
    console.log("🔑 Password: admin123");
    console.log("👑 Role: admin");

    // Create a staff user for testing
    const staffUser = new User({
      username: "staff",
      email: "staff@ahaclinic.com",
      password: "staff123",
      role: "staff",
      mustChangePassword: false,
    });

    await staffUser.save();
    console.log("\n✅ Staff user created for testing!");
    console.log("📝 Username: staff");
    console.log("🔑 Password: staff123");
    console.log("👤 Role: staff");

    // Create a regular user for testing
    const regularUser = new User({
      username: "user",
      email: "user@ahaclinic.com",
      password: "user123",
      role: "user",
      mustChangePassword: false,
    });

    await regularUser.save();
    console.log("\n✅ Regular user created for testing!");
    console.log("📝 Username: user");
    console.log("🔑 Password: user123");
    console.log("👤 Role: user");

    console.log("\n🎉 Initial users setup completed!");
    console.log("\nNow you can test the RBAC system with:");
    console.log("• Admin: full access to everything");
    console.log("• Staff: read-only access to organizations/org animals");
    console.log("• User: read-only access to everything");
  } catch (error) {
    console.error("❌ Error creating initial users:", error);
  } finally {
    await mongoose.disconnect();
    console.log("\n📡 Disconnected from MongoDB");
  }
}

createInitialAdmin();
