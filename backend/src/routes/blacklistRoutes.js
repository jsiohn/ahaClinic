import express from "express";
import Blacklist from "../models/Blacklist.js";
import { validateBlacklist } from "../middleware/blacklistValidation.js";
import { auth } from "../middleware/auth.js";

const router = express.Router();

// Get all blacklist entries
router.get("/", auth, async (req, res) => {
  try {
    const blacklistEntries = await Blacklist.find();
    res.json(blacklistEntries);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get single blacklist entry
router.get("/:id", auth, async (req, res) => {
  try {
    const blacklistEntry = await Blacklist.findById(req.params.id);
    if (!blacklistEntry) {
      return res.status(404).json({ message: "Blacklist entry not found" });
    }
    res.json(blacklistEntry);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Create blacklist entry
router.post("/", auth, validateBlacklist, async (req, res) => {
  try {
    const blacklistEntry = new Blacklist(req.body);
    const newBlacklistEntry = await blacklistEntry.save();
    res.status(201).json(newBlacklistEntry);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Update blacklist entry
router.put("/:id", auth, validateBlacklist, async (req, res) => {
  try {
    const blacklistEntry = await Blacklist.findById(req.params.id);
    if (!blacklistEntry) {
      return res.status(404).json({ message: "Blacklist entry not found" });
    }
    Object.assign(blacklistEntry, req.body);
    const updatedBlacklistEntry = await blacklistEntry.save();
    res.json(updatedBlacklistEntry);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Delete blacklist entry
router.delete("/:id", auth, async (req, res) => {
  try {
    const blacklistEntry = await Blacklist.findById(req.params.id);
    if (!blacklistEntry) {
      return res.status(404).json({ message: "Blacklist entry not found" });
    }
    await blacklistEntry.deleteOne();
    res.json({ message: "Blacklist entry deleted" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;
