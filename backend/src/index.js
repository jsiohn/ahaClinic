import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import dotenv from "dotenv";
import clientRoutes from "./routes/clientRoutes.js";
import animalRoutes from "./routes/animalRoutes.js";
import invoiceRoutes from "./routes/invoiceRoutes.js";
import organizationRoutes from "./routes/organizationRoutes.js";
import blacklistRoutes from "./routes/blacklistRoutes.js";
import authRoutes from "./routes/authRoutes.js";
import documentRoutes from "./routes/documentRoutes.js";

// Load environment variables
dotenv.config();

const app = express();

// Middleware
app.use(
  cors({
    origin: [
      "http://localhost:3000",
      "http://localhost:5173", // React app
      "https://ahaclinic.onrender.com",
    ],
    credentials: true, // Allow cookies to be sent
  })
);
app.use(express.json());

// MongoDB connection
const MONGODB_URI =
  process.env.MONGODB_URI || "mongodb://localhost:27017/ahaclinic";

mongoose
  .connect(MONGODB_URI)
  .then(() => console.log("Connected to MongoDB"))
  .catch((error) => console.error("MongoDB connection error:", error));

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/clients", clientRoutes);
app.use("/api/animals", animalRoutes);
app.use("/api/invoices", invoiceRoutes);
app.use("/api/organizations", organizationRoutes);
app.use("/api/blacklist", blacklistRoutes);
app.use("/api/documents", documentRoutes);

// Basic route
app.get("/", (req, res) => {
  res.json({ message: "Welcome to AhaClinic API" });
});

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
