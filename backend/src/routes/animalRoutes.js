import express from "express";
import Animal from "../models/Animal.js";
import { validateAnimal } from "../middleware/animalValidation.js";
import { auth, requirePermission } from "../middleware/auth.js";
import { PERMISSIONS } from "../config/roles.js";

const router = express.Router();

// Get all animals
router.get(
  "/",
  auth,
  requirePermission(PERMISSIONS.READ_ANIMALS),
  async (req, res) => {
    try {
      const filter = {};

      // Filter by organization if provided
      if (req.query.organization) {
        filter.organization = req.query.organization;
      }

      // Filter by client if provided
      if (req.query.client) {
        filter.client = req.query.client;
      }

      const animals = await Animal.find(filter)
        .populate("client", "firstName lastName")
        .populate("organization", "name");

      res.json(animals);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }
);

// Get animals by client
router.get(
  "/client/:clientId",
  auth,
  requirePermission(PERMISSIONS.READ_ANIMALS),
  async (req, res) => {
    try {
      const animals = await Animal.find({
        client: req.params.clientId,
      });
      res.json(animals);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }
);

// Get animals by organization
router.get(
  "/organization/:organizationId",
  auth,
  requirePermission(PERMISSIONS.READ_ORGANIZATION_ANIMALS),
  async (req, res) => {
    try {
      const animals = await Animal.find({
        organization: req.params.organizationId,
      })
        .populate("client", "firstName lastName")
        .populate("organization", "name");

      res.json(animals);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }
);

// Get a single animal
router.get(
  "/:id",
  auth,
  requirePermission(PERMISSIONS.READ_ANIMALS),
  async (req, res) => {
    try {
      const animal = await Animal.findById(req.params.id)
        .populate("client", "firstName lastName")
        .populate("organization", "name");

      if (!animal) {
        return res.status(404).json({ message: "Animal not found" });
      }

      res.json(animal);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }
);

// Create a new animal
router.post(
  "/",
  auth,
  requirePermission(PERMISSIONS.CREATE_ANIMALS),
  validateAnimal,
  async (req, res) => {
    try {
      const animal = new Animal(req.body);
      const newAnimal = await animal.save();

      await newAnimal.populate("client", "firstName lastName");
      await newAnimal.populate("organization", "name");

      res.status(201).json(newAnimal);
    } catch (error) {
      res.status(400).json({ message: error.message });
    }
  }
);

// Update an animal
router.put(
  "/:id",
  auth,
  requirePermission(PERMISSIONS.UPDATE_ANIMALS),
  validateAnimal,
  async (req, res) => {
    try {
      const animal = await Animal.findById(req.params.id);
      if (!animal) {
        return res.status(404).json({ message: "Animal not found" });
      }
      Object.assign(animal, req.body);
      const updatedAnimal = await animal.save();

      await updatedAnimal.populate("client", "firstName lastName");
      await updatedAnimal.populate("organization", "name");

      res.json(updatedAnimal);
    } catch (error) {
      res.status(400).json({ message: error.message });
    }
  }
);

// Hard delete an animal
router.delete(
  "/:id",
  auth,
  requirePermission(PERMISSIONS.DELETE_ANIMALS),
  async (req, res) => {
    try {
      const deletedAnimal = await Animal.findByIdAndDelete(req.params.id);
      if (!deletedAnimal) {
        return res.status(404).json({ message: "Animal not found" });
      }
      res.json({ message: "Animal deleted successfully" });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }
);

// Add a medical record to an animal
router.post(
  "/:id/medical-records",
  auth,
  requirePermission(PERMISSIONS.CREATE_MEDICAL_RECORDS),
  async (req, res) => {
    try {
      const animal = await Animal.findById(req.params.id);
      if (!animal) {
        return res.status(404).json({ message: "Animal not found" });
      }

      const newMedicalRecord = {
        date: req.body.date || new Date(),
        procedure: req.body.procedure,
        notes: req.body.notes,
        veterinarian: req.body.veterinarian,
      };

      animal.medicalHistory.push(newMedicalRecord);
      const updatedAnimal = await animal.save();

      await updatedAnimal.populate("client", "firstName lastName");
      await updatedAnimal.populate("organization", "name");

      res.status(201).json(updatedAnimal);
    } catch (error) {
      res.status(400).json({ message: error.message });
    }
  }
);

// Update a medical record
router.put(
  "/:id/medical-records/:recordId",
  auth,
  requirePermission(PERMISSIONS.UPDATE_MEDICAL_RECORDS),
  async (req, res) => {
    try {
      const animal = await Animal.findById(req.params.id);
      if (!animal) {
        return res.status(404).json({ message: "Animal not found" });
      }

      const medicalRecord = animal.medicalHistory.id(req.params.recordId);
      if (!medicalRecord) {
        return res.status(404).json({ message: "Medical record not found" });
      }

      // Update the medical record
      medicalRecord.date = req.body.date || medicalRecord.date;
      medicalRecord.procedure = req.body.procedure || medicalRecord.procedure;
      medicalRecord.notes = req.body.notes || medicalRecord.notes;
      medicalRecord.veterinarian =
        req.body.veterinarian || medicalRecord.veterinarian;
      medicalRecord.updatedAt = new Date();

      const updatedAnimal = await animal.save();

      await updatedAnimal.populate("client", "firstName lastName");
      await updatedAnimal.populate("organization", "name");

      res.json(updatedAnimal);
    } catch (error) {
      res.status(400).json({ message: error.message });
    }
  }
);

// Delete a medical record
router.delete(
  "/:id/medical-records/:recordId",
  auth,
  requirePermission(PERMISSIONS.DELETE_MEDICAL_RECORDS),
  async (req, res) => {
    try {
      const animal = await Animal.findById(req.params.id);
      if (!animal) {
        return res.status(404).json({ message: "Animal not found" });
      }

      const medicalRecord = animal.medicalHistory.id(req.params.recordId);
      if (!medicalRecord) {
        return res.status(404).json({ message: "Medical record not found" });
      }

      // Remove the medical record
      medicalRecord.deleteOne();
      const updatedAnimal = await animal.save();

      await updatedAnimal.populate("client", "firstName lastName");
      await updatedAnimal.populate("organization", "name");

      res.json(updatedAnimal);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }
);

export default router;
