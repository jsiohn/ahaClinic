import express from "express";
import Invoice from "../models/Invoice.js";
import { validateInvoice } from "../middleware/invoiceValidation.js";
import { auth } from "../middleware/auth.js";

const router = express.Router();

// Get all invoices
router.get("/", auth, async (req, res) => {
  try {
    const invoices = await Invoice.find()
      .populate("client", "firstName lastName")
      .populate("animal", "name species");
    res.json(invoices);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get invoices by client
router.get("/client/:clientId", async (req, res) => {
  try {
    const invoices = await Invoice.find({ client: req.params.clientId })
      .populate("client", "firstName lastName")
      .populate("animal", "name species");
    res.json(invoices);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get invoices by animal
router.get("/animal/:animalId", async (req, res) => {
  try {
    const invoices = await Invoice.find({ animal: req.params.animalId })
      .populate("client", "firstName lastName")
      .populate("animal", "name species");
    res.json(invoices);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get a single invoice
router.get("/:id", auth, async (req, res) => {
  try {
    const invoice = await Invoice.findById(req.params.id)
      .populate("client", "firstName lastName")
      .populate("animal", "name species");
    if (!invoice) {
      return res.status(404).json({ message: "Invoice not found" });
    }
    res.json(invoice);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Create a new invoice
router.post("/", auth, validateInvoice, async (req, res) => {
  try {
    // Check if invoice number already exists
    const existingInvoice = await Invoice.findOne({
      invoiceNumber: req.body.invoiceNumber,
    });
    if (existingInvoice) {
      return res.status(400).json({ message: "Invoice number already exists" });
    }

    const invoice = new Invoice(req.body);
    const newInvoice = await invoice.save();
    await newInvoice.populate("client", "firstName lastName");
    await newInvoice.populate("animal", "name species");
    res.status(201).json(newInvoice);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Update an invoice
router.put("/:id", auth, validateInvoice, async (req, res) => {
  try {
    const invoice = await Invoice.findById(req.params.id);
    if (!invoice) {
      return res.status(404).json({ message: "Invoice not found" });
    }

    // Check if invoice number is being changed and if it's already taken
    if (
      req.body.invoiceNumber &&
      req.body.invoiceNumber !== invoice.invoiceNumber
    ) {
      const existingInvoice = await Invoice.findOne({
        invoiceNumber: req.body.invoiceNumber,
      });
      if (existingInvoice) {
        return res
          .status(400)
          .json({ message: "Invoice number already exists" });
      }
    }

    Object.assign(invoice, req.body);
    const updatedInvoice = await invoice.save();
    await updatedInvoice.populate("client", "firstName lastName");
    await updatedInvoice.populate("animal", "name species");
    res.json(updatedInvoice);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Update invoice status
router.patch("/:id/status", async (req, res) => {
  try {
    const { status } = req.body;
    if (!["draft", "sent", "paid", "overdue", "cancelled"].includes(status)) {
      return res.status(400).json({ message: "Invalid status" });
    }

    const invoice = await Invoice.findById(req.params.id);
    if (!invoice) {
      return res.status(404).json({ message: "Invoice not found" });
    }

    invoice.status = status;
    if (status === "paid") {
      invoice.paymentDate = new Date();
    }

    const updatedInvoice = await invoice.save();
    await updatedInvoice.populate("client", "firstName lastName");
    await updatedInvoice.populate("animal", "name species");
    res.json(updatedInvoice);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Delete invoice
router.delete("/:id", auth, async (req, res) => {
  try {
    const deletedInvoice = await Invoice.findByIdAndDelete(req.params.id);
    if (!deletedInvoice) {
      return res.status(404).json({ message: "Invoice not found" });
    }
    res.json({ message: "Invoice deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;
