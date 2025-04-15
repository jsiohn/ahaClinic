import express from "express";
import Animal from "../models/Animal.js";
import { validateAnimal } from "../middleware/animalValidation.js";
import { auth } from "../middleware/auth.js";

const router = express.Router();

// Get all animals
router.get("/", auth, async (req, res) => {
  try {
    const animals = await Animal.find().populate(
      "client",
      "firstName lastName"
    );
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

// Get a single animal
router.get("/:id", auth, async (req, res) => {
  try {
    const animal = await Animal.findById(req.params.id).populate(
      "client",
      "firstName lastName"
    );
    if (!animal) {
      return res.status(404).json({ message: "Animal not found" });
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
    await newAnimal.populate("client", "firstName lastName");
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
    await updatedAnimal.populate("client", "firstName lastName");
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

export default router;
