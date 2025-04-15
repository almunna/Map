// controller/auth.admin.js
import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import dotenv from "dotenv";
import UserModel from "../Models/user.model.js";

dotenv.config();

if (!process.env.MONGO_URI) {
  console.error("❌ MONGO_URI is not defined in .env file.");
  process.exit(1);
}

await mongoose.connect(process.env.MONGO_URI);
console.log("✅ MongoDB connected");

// 🔥 Delete all existing admins
const result = await UserModel.deleteMany({ role: "ADMIN" });
if (result.deletedCount > 0) {
  console.log(`🗑️ Deleted ${result.deletedCount} old admin(s).`);
}

// 🔐 Create new admin
const hashedPassword = await bcrypt.hash("Admin@12345", 10);

await UserModel.create({
  name: "Admin",
  email: "admin@example1.com",
  password: hashedPassword,
  role: "ADMIN",
  verify_email: true,
});

console.log("✅ New admin user created");
process.exit();
