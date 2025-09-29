import express from "express";
import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";
import { auth, requirePermission } from "../middleware/auth.js";
import { PERMISSIONS } from "../config/roles.js";

const router = express.Router();

// Get __dirname equivalent in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Path to the services JSON file
const SERVICES_FILE_PATH = path.join(
  __dirname,
  "../../../src/data/clinicServices.json"
);

// GET /api/services - Retrieve all services
router.get("/", auth, async (req, res) => {
  try {
    const servicesData = await fs.readFile(SERVICES_FILE_PATH, "utf-8");
    const services = JSON.parse(servicesData);
    res.json(services);
  } catch (error) {
    console.error("Error reading services file:", error);
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

      // Create backup of current services file
      const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
      const backupDir = path.join(__dirname, "../../../backups/services");
      const backupPath = path.join(
        backupDir,
        `clinicServices.${timestamp}.${req.user.username}.json`
      );

      try {
        // Ensure backup directory exists
        await fs.mkdir(backupDir, { recursive: true });

        const currentData = await fs.readFile(SERVICES_FILE_PATH, "utf-8");
        await fs.writeFile(backupPath, currentData);
        console.log(`Services backup created: ${backupPath}`);
      } catch (backupError) {
        console.warn("Warning: Failed to create backup:", backupError.message);
        // Continue with update even if backup fails
      }

      // Write the new services data
      await fs.writeFile(
        SERVICES_FILE_PATH,
        JSON.stringify(services, null, 2),
        "utf-8"
      );

      console.log(`Services updated by user: ${req.user.username}`);

      res.json({
        message: "Services updated successfully",
        updatedBy: req.user.username,
        updatedAt: new Date().toISOString(),
        backupCreated: true,
      });
    } catch (error) {
      console.error("Error updating services file:", error);
      res.status(500).json({
        message: "Failed to update services",
        error: error.message,
      });
    }
  }
);

export default router;
