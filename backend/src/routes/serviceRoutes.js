import express from "express";
import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";
import { auth, requirePermission } from "../middleware/auth.js";
import { PERMISSIONS } from "../config/roles.js";
import ServiceCategory from "../models/ServiceCategory.js";

const router = express.Router();

// Get __dirname equivalent in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Path to the services JSON file (for initial seeding only)
const SERVICES_FILE_PATH = path.join(
  __dirname,
  "../../../src/data/clinicServices.json"
);

// GET /api/services - Retrieve all services
router.get("/", auth, async (req, res) => {
  try {
    // Check if we have services in the database
    let services = await ServiceCategory.find().sort({ category: 1 });

    // If database is empty, seed from JSON file
    if (services.length === 0) {
      try {
        const servicesData = await fs.readFile(SERVICES_FILE_PATH, "utf-8");
        const jsonServices = JSON.parse(servicesData);

        // Insert services into database
        await ServiceCategory.insertMany(jsonServices);
        services = await ServiceCategory.find().sort({ category: 1 });

        console.log("Services seeded from JSON file to database");
      } catch (seedError) {
        console.error("Error seeding services from file:", seedError);
        // If seeding fails, return empty array
        return res.json([]);
      }
    }

    // Convert MongoDB documents to plain objects without _id and __v
    const plainServices = services.map((cat) => ({
      category: cat.category,
      services: cat.services.map((svc) => ({
        name: svc.name,
        price: svc.price,
      })),
    }));

    res.json(plainServices);
  } catch (error) {
    console.error("Error reading services:", error);
    res.status(500).json({
      message: "Failed to load services",
      error: error.message,
    });
  }
});

// PUT /api/services - Update all services (admin only)
router.put(
  "/",
  auth,
  requirePermission(PERMISSIONS.MANAGE_SYSTEM_SETTINGS),
  async (req, res) => {
    try {
      const { services } = req.body;

      // Validate the services data structure
      if (!Array.isArray(services)) {
        return res.status(400).json({
          message: "Services must be an array",
        });
      }

      // Validate each service category
      for (const category of services) {
        if (!category.category || typeof category.category !== "string") {
          return res.status(400).json({
            message: "Each service category must have a valid category name",
          });
        }

        if (!Array.isArray(category.services)) {
          return res.status(400).json({
            message: "Each category must have a services array",
          });
        }

        // Validate each service in the category
        for (const service of category.services) {
          if (!service.name || typeof service.name !== "string") {
            return res.status(400).json({
              message: "Each service must have a valid name",
            });
          }

          if (!service.price || typeof service.price !== "string") {
            return res.status(400).json({
              message: "Each service must have a valid price",
            });
          }
        }
      }

      // Delete all existing services and insert new ones
      await ServiceCategory.deleteMany({});
      await ServiceCategory.insertMany(services);

      console.log(`Services updated by user: ${req.user.username}`);

      res.json({
        message: "Services updated successfully",
        updatedBy: req.user.username,
        updatedAt: new Date().toISOString(),
      });
    } catch (error) {
      console.error("Error updating services:", error);
      res.status(500).json({
        message: "Failed to update services",
        error: error.message,
      });
    }
  }
);

export default router;
