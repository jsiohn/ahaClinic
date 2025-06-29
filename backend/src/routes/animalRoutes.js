import express from "express";
import Animal from "../models/Animal.js";
import { validateAnimal } from "../middleware/animalValidation.js";
import { auth } from "../middleware/auth.js";

const router = express.Router();

// Get all animals
router.get("/", auth, async (req, res) => {
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

    const animals = await Animal.find(filter);

    // Since we've added optional clients, we need to be careful with populate
    for (let animal of animals) {
      if (animal.client) {
        await animal.populate("client", "firstName lastName");
      }
      if (animal.organization) {
        await animal.populate("organization", "name");
      }
    }

    res.json(animals);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get animals by client
router.get("/client/:clientId", async (req, res) => {
  try {
    const animals = await Animal.find({
      client: req.params.clientId,
    });
    res.json(animals);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get animals by organization
router.get("/organization/:organizationId", auth, async (req, res) => {
  try {
    const animals = await Animal.find({
      organization: req.params.organizationId,
    });

    // Since we've added optional clients, we need to be careful with populate
    for (let animal of animals) {
      if (animal.client) {
        await animal.populate("client", "firstName lastName");
      }
      if (animal.organization) {
        await animal.populate("organization", "name");
      }
    }

    res.json(animals);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get a single animal
router.get("/:id", auth, async (req, res) => {
  try {
    const animal = await Animal.findById(req.params.id);

    if (!animal) {
      return res.status(404).json({ message: "Animal not found" });
    }

    // Only populate client if it exists
    if (animal.client) {
      await animal.populate("client", "firstName lastName");
    }

    // Only populate organization if it exists
    if (animal.organization) {
      await animal.populate("organization", "name");
    }

    res.json(animal);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Create a new animal
router.post("/", auth, validateAnimal, async (req, res) => {
  try {
    const animal = new Animal(req.body);
    const newAnimal = await animal.save();

    // Only populate client if it exists
    if (newAnimal.client) {
      await newAnimal.populate("client", "firstName lastName");
    }

    await newAnimal.populate("organization", "name");
    res.status(201).json(newAnimal);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Update an animal
router.put("/:id", auth, validateAnimal, async (req, res) => {
  try {
    const animal = await Animal.findById(req.params.id);
    if (!animal) {
      return res.status(404).json({ message: "Animal not found" });
    }
    Object.assign(animal, req.body);
    const updatedAnimal = await animal.save();

    // Only populate client if it exists
    if (updatedAnimal.client) {
      await updatedAnimal.populate("client", "firstName lastName");
    }

    await updatedAnimal.populate("organization", "name");
    res.json(updatedAnimal);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Hard delete an animal
router.delete("/:id", auth, async (req, res) => {
  try {
    const deletedAnimal = await Animal.findByIdAndDelete(req.params.id);
    if (!deletedAnimal) {
      return res.status(404).json({ message: "Animal not found" });
    }
    res.json({ message: "Animal deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Add a medical record to an animal
router.post("/:id/medical-records", auth, async (req, res) => {
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

    // Only populate client if it exists
    if (updatedAnimal.client) {
      await updatedAnimal.populate("client", "firstName lastName");
    }

    // Only populate organization if it exists
    if (updatedAnimal.organization) {
      await updatedAnimal.populate("organization", "name");
    }

    res.status(201).json(updatedAnimal);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

export default router;
