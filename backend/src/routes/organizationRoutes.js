import express from "express";
import Organization from "../models/Organization.js";
import { validateOrganization } from "../middleware/organizationValidation.js";
import { auth } from "../middleware/auth.js";

const router = express.Router();

// Get all organizations
router.get("/", auth, async (req, res) => {
  try {
    const organizations = await Organization.find();
    res.json(organizations);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get a single organization
router.get("/:id", auth, async (req, res) => {
  try {
    const organization = await Organization.findById(req.params.id);
    if (!organization) {
      return res.status(404).json({ message: "Organization not found" });
    }
    res.json(organization);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Create a new organization
router.post("/", auth, validateOrganization, async (req, res) => {
  try {
    const organization = new Organization(req.body);
    const newOrganization = await organization.save();
    res.status(201).json(newOrganization);
  } catch (error) {
    console.error("Error creating organization:", error);
    res.status(400).json({ message: error.message });
  }
});

// Update an organization
router.put("/:id", auth, validateOrganization, async (req, res) => {
  try {
    const organization = await Organization.findById(req.params.id);
    if (!organization) {
      return res.status(404).json({ message: "Organization not found" });
    }

    Object.assign(organization, req.body);
    const updatedOrganization = await organization.save();
    res.json(updatedOrganization);
  } catch (error) {
    console.error("Error updating organization:", error);
    res.status(400).json({ message: error.message });
  }
});

// Delete an organization
router.delete("/:id", auth, async (req, res) => {
  try {
    const organization = await Organization.findById(req.params.id);
    if (!organization) {
      return res.status(404).json({ message: "Organization not found" });
    }

    await organization.deleteOne();
    res.json({ message: "Organization deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

/* To be implemented later:
// Update business hours
router.patch("/:id/business-hours", async (req, res) => {
  try {
    const organization = await Organization.findById(req.params.id);
    if (!organization) {
      return res.status(404).json({ message: "Organization not found" });
    }

    // Validate each day's hours
    const days = [
      "monday",
      "tuesday",
      "wednesday",
      "thursday",
      "friday",
      "saturday",
      "sunday",
    ];

    for (const day of days) {
      if (req.body[day]) {
        if (req.body[day].open) {
          if (!/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/.test(req.body[day].open)) {
            return res
              .status(400)
              .json({ message: `Invalid opening time format for ${day}` });
          }
        }
        if (req.body[day].close) {
          if (!/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/.test(req.body[day].close)) {
            return res
              .status(400)
              .json({ message: `Invalid closing time format for ${day}` });
          }
        }
        organization.businessHours[day] = req.body[day];
      }
    }

    const updatedOrganization = await organization.save();
    res.json(updatedOrganization);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});
*/

export default router;
