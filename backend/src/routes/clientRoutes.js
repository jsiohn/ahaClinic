import express from "express";
import Client from "../models/Client.js";
import Animal from "../models/Animal.js";
import { validateClient } from "../middleware/clientValidation.js";
import { auth, requirePermission } from "../middleware/auth.js";
import { PERMISSIONS } from "../config/roles.js";

const router = express.Router();

// Get all clients
router.get(
  "/",
  auth,
  requirePermission(PERMISSIONS.READ_CLIENTS),
  async (req, res) => {
    try {
      const clients = await Client.find();
      res.json(clients);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }
);

// Get a single client
router.get(
  "/:id",
  auth,
  requirePermission(PERMISSIONS.READ_CLIENTS),
  async (req, res) => {
    try {
      const client = await Client.findById(req.params.id);
      if (!client) {
        return res.status(404).json({ message: "Client not found" });
      }
      res.json(client);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }
);

// Create a new client
router.post(
  "/",
  auth,
  requirePermission(PERMISSIONS.CREATE_CLIENTS),
  validateClient,
  async (req, res) => {
    try {
      const existingClient = await Client.findOne({ email: req.body.email });
      if (existingClient) {
        return res.status(400).json({ message: "Email already exists" });
      }

      const client = new Client(req.body);
      const newClient = await client.save();
      res.status(201).json(newClient);
    } catch (error) {
      res.status(400).json({ message: error.message });
    }
  }
);

// Update a client
router.put(
  "/:id",
  auth,
  requirePermission(PERMISSIONS.UPDATE_CLIENTS),
  validateClient,
  async (req, res) => {
    try {
      const client = await Client.findById(req.params.id);
      if (!client) {
        return res.status(404).json({ message: "Client not found" });
      }

      // Check if email is being changed and if it's already taken
      if (req.body.email && req.body.email !== client.email) {
        const existingClient = await Client.findOne({ email: req.body.email });
        if (existingClient) {
          return res.status(400).json({ message: "Email already exists" });
        }
      }

      Object.assign(client, req.body);
      const updatedClient = await client.save();
      res.json(updatedClient);
    } catch (error) {
      res.status(400).json({ message: error.message });
    }
  }
);

// Delete a client
router.delete(
  "/:id",
  auth,
  requirePermission(PERMISSIONS.DELETE_CLIENTS),
  async (req, res) => {
    try {
      // Check if client has any associated animals
      const hasAnimals = await Animal.exists({ client: req.params.id });
      if (hasAnimals) {
        return res.status(400).json({
          message:
            "Cannot delete client because they have animals associated with them. Please remove or reassign the animals first.",
        });
      }

      const deletedClient = await Client.findByIdAndDelete(req.params.id);
      if (!deletedClient) {
        return res.status(404).json({ message: "Client not found" });
      }
      res.json({ message: "Client deleted successfully" });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }
);

export default router;
