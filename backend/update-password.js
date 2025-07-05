// Update testuser password
import mongoose from "mongoose";
import dotenv from "dotenv";
import User from "./src/models/User.js";

dotenv.config();

async function updatePassword() {
  try {
    const MONGODB_URI =
      process.env.MONGODB_URI || "mongodb://localhost:27017/ahaclinic";
    await mongoose.connect(MONGODB_URI);
    console.log("✅ Connected to MongoDB");

    const user = await User.findOne({ username: "testuser" });
    if (!user) {
      console.log("❌ User not found");
      return;
    }

    user.password = "admin123";
    await user.save();

    console.log("✅ Password updated successfully!");
    console.log("📝 Username: testuser");
    console.log("🔑 Password: admin123");
    console.log("👑 Role:", user.role);
  } catch (error) {
    console.error("❌ Error:", error);
  } finally {
    await mongoose.disconnect();
  }
}

updatePassword();
