import express from "express";
import multer from "multer";
import Document from "../models/Document.js";
import { auth } from "../middleware/auth.js";
import crypto from "crypto";

const router = express.Router();

// Configure multer for file uploads
const storage = multer.memoryStorage();
const upload = multer({
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (req, file, cb) => {
    // Accept only PDF files
    if (file.mimetype === "application/pdf") {
      cb(null, true);
    } else {
      cb(new Error("Only PDF files are allowed"));
    }
  },
});

// Get all documents
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

    // Filter by animal if provided
    if (req.query.animal) {
      filter.animal = req.query.animal;
    }

    // Don't return the file data in the list to reduce payload size
    const documents = await Document.find(filter)
      .select("-fileData -versions.fileData")
      .populate("animal", "name species")
      .populate("client", "firstName lastName")
      .populate("organization", "name");

    res.json(documents);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get a single document
router.get("/:id", auth, async (req, res) => {
  try {
    const document = await Document.findById(req.params.id)
      .select("-fileData -versions.fileData")
      .populate("animal", "name species")
      .populate("client", "firstName lastName")
      .populate("organization", "name");

    if (!document) {
      return res.status(404).json({ message: "Document not found" });
    }

    res.json(document);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get document file
router.get("/:id/file", auth, async (req, res) => {
  try {
    const document = await Document.findById(req.params.id);

    if (!document) {
      return res.status(404).json({ message: "Document not found" });
    }

    // Send the file data with proper content type
    res.contentType("application/pdf");
    res.send(document.fileData);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get specific version of a document
router.get("/:id/version/:versionNumber", auth, async (req, res) => {
  try {
    const document = await Document.findById(req.params.id);

    if (!document) {
      return res.status(404).json({ message: "Document not found" });
    }

    const versionNumber = parseInt(req.params.versionNumber);

    // If requesting current version
    if (versionNumber === document.currentVersion) {
      res.contentType("application/pdf");
      return res.send(document.fileData);
    }

    // Versions are 1-indexed in the UI but 0-indexed in the array
    const versionIndex = versionNumber - 1;

    if (versionIndex < 0 || versionIndex >= document.versions.length) {
      return res.status(404).json({ message: "Version not found" });
    }

    res.contentType("application/pdf");
    res.send(document.versions[versionIndex].fileData);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Upload a new document
router.post("/", auth, upload.single("file"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "PDF file is required" });
    }

    const document = new Document({
      name: req.body.name || req.file.originalname,
      description: req.body.description || "",
      fileType: "PDF",
      fileData: req.file.buffer,
      animal: req.body.animal || null,
      client: req.body.client || null,
      organization: req.body.organization || null,
      isEditable: req.body.isEditable !== "false",
      isPrintable: req.body.isPrintable !== "false",
      currentVersion: 1,
      versions: [],
    });

    const newDocument = await document.save();

    // Don't return the file data in the response to reduce payload size
    const response = { ...newDocument.toObject() };
    delete response.fileData;
    delete response.versions;

    res.status(201).json(response);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Update a document
router.put("/:id", auth, upload.single("file"), async (req, res) => {
  try {
    const document = await Document.findById(req.params.id);

    if (!document) {
      return res.status(404).json({ message: "Document not found" });
    }

    // Update metadata
    if (req.body.name) document.name = req.body.name;
    if (req.body.description) document.description = req.body.description;
    if (req.body.animal) document.animal = req.body.animal;
    if (req.body.client) document.client = req.body.client;
    if (req.body.organization) document.organization = req.body.organization;
    if (req.body.isEditable !== undefined)
      document.isEditable = req.body.isEditable !== "false";
    if (req.body.isPrintable !== undefined)
      document.isPrintable = req.body.isPrintable !== "false";

    // Update file data if a new file is provided
    if (req.file) {
      // Save the current version
      const currentVersion = {
        fileData: document.fileData,
        createdAt: document.updatedAt,
        createdBy: req.user ? req.user._id : null,
        notes: req.body.versionNotes || `Version ${document.currentVersion}`,
      };

      document.versions.push(currentVersion);
      document.currentVersion++;
      document.fileData = req.file.buffer;
    }

    const updatedDocument = await document.save();

    // Don't return the file data in the response
    const response = { ...updatedDocument.toObject() };
    delete response.fileData;

    // Remove file data from versions too
    if (response.versions) {
      response.versions = response.versions.map((v) => {
        const versionCopy = { ...v };
        delete versionCopy.fileData;
        return versionCopy;
      });
    }

    res.json(response);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Generate a sharing link for a document
router.post("/:id/share", auth, async (req, res) => {
  try {
    const document = await Document.findById(req.params.id);

    if (!document) {
      return res.status(404).json({ message: "Document not found" });
    }

    const expiryDays = req.body.expiryDays || 7; // Default 7 days
    const expiry = new Date();
    expiry.setDate(expiry.getDate() + expiryDays);

    // Generate a unique token
    const token = crypto.randomBytes(20).toString("hex");

    document.isShared = true;
    document.shareLink = token;
    document.shareLinkExpiry = expiry;

    await document.save();

    res.json({
      shareLink: `${req.protocol}://${req.get("host")}/share/${token}`,
      expiry: expiry,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Access a shared document via token
router.get("/share/:token", async (req, res) => {
  try {
    const document = await Document.findOne({
      shareLink: req.params.token,
      shareLinkExpiry: { $gt: new Date() }, // Link must not be expired
    });

    if (!document) {
      return res
        .status(404)
        .json({ message: "Shared document not found or link expired" });
    }

    // Send the file data with proper content type
    res.contentType("application/pdf");
    res.send(document.fileData);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Delete a document
router.delete("/:id", auth, async (req, res) => {
  try {
    const document = await Document.findByIdAndDelete(req.params.id);

    if (!document) {
      return res.status(404).json({ message: "Document not found" });
    }

    res.json({ message: "Document deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;
