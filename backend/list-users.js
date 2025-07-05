// List existing users
import mongoose from "mongoose";
import dotenv from "dotenv";
import User from "./src/models/User.js";

dotenv.config();

async function listUsers() {
  try {
    const MONGODB_URI =
      process.env.MONGODB_URI || "mongodb://localhost:27017/ahaclinic";
    await mongoose.connect(MONGODB_URI);
    console.log("✅ Connected to MongoDB\n");

    const users = await User.find({}, "-password").sort({ createdAt: -1 });

    console.log(`📋 Found ${users.length} users:\n`);
    users.forEach((user, index) => {
      console.log(`${index + 1}. ${user.username}`);
      console.log(`   📧 Email: ${user.email}`);
      console.log(`   👤 Role: ${user.role}`);
      console.log(
        `   🔒 Must change password: ${user.mustChangePassword || false}`
      );
      console.log(`   📅 Created: ${user.createdAt}\n`);
    });
  } catch (error) {
    console.error("❌ Error:", error);
  } finally {
    await mongoose.disconnect();
  }
}

listUsers();
