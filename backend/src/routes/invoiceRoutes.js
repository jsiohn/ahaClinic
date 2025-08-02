import express from "express";
import Invoice from "../models/Invoice.js";
import { validateInvoice } from "../middleware/invoiceValidation.js";
import { auth, requirePermission } from "../middleware/auth.js";
import { PERMISSIONS } from "../config/roles.js";

const router = express.Router();

const transformInvoice = (invoice) => {
  const invoiceObj = invoice.toObject({ getters: true }); // Include getters to use schema formatting
  return {
    ...invoiceObj,
    subtotal: parseFloat(Number(invoiceObj.subtotal).toFixed(2)),
    total: parseFloat(Number(invoiceObj.total).toFixed(2)),
    animalSections: invoiceObj.animalSections.map((section) => ({
      ...section,
      subtotal: parseFloat(Number(section.subtotal).toFixed(2)),
      items: section.items.map((item) => ({
        ...item,
        quantity: Math.max(1, parseInt(String(item.quantity))),
        unitPrice: parseFloat(Number(item.unitPrice).toFixed(2)),
        total: parseFloat(Number(item.total).toFixed(2)),
      })),
    })),
  };
};

// Get all invoices
router.get(
  "/",
  auth,
  requirePermission(PERMISSIONS.READ_INVOICES),
  async (req, res) => {
    try {
      const invoices = await Invoice.find()
        .populate("client", "firstName lastName")
        .populate("animalSections.animalId", "name species");

      const transformedInvoices = invoices.map(transformInvoice);
      res.json(transformedInvoices);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }
);

// Get invoices by client
router.get(
  "/client/:clientId",
  auth,
  requirePermission(PERMISSIONS.READ_INVOICES),
  async (req, res) => {
    try {
      const invoices = await Invoice.find({ client: req.params.clientId })
        .populate("client", "firstName lastName")
        .populate("animalSections.animalId", "name species");

      const transformedInvoices = invoices.map(transformInvoice);
      res.json(transformedInvoices);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }
);

// Get invoices by animal
router.get(
  "/animal/:animalId",
  auth,
  requirePermission(PERMISSIONS.READ_INVOICES),
  async (req, res) => {
    try {
      const invoices = await Invoice.find({
        "animalSections.animalId": req.params.animalId,
      })
        .populate("client", "firstName lastName")
        .populate("animalSections.animalId", "name species");

      const transformedInvoices = invoices.map(transformInvoice);
      res.json(transformedInvoices);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }
);

// Get a single invoice
router.get(
  "/:id",
  auth,
  requirePermission(PERMISSIONS.READ_INVOICES),
  async (req, res) => {
    try {
      const invoice = await Invoice.findById(req.params.id)
        .populate("client", "firstName lastName")
        .populate("animalSections.animalId", "name species");
      if (!invoice) {
        return res.status(404).json({ message: "Invoice not found" });
      }
      res.json(transformInvoice(invoice));
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }
);

// Create a new invoice
router.post(
  "/",
  auth,
  requirePermission(PERMISSIONS.CREATE_INVOICES),
  validateInvoice,
  async (req, res) => {
    try {
      console.log(
        "Creating invoice with data:",
        JSON.stringify(req.body, null, 2)
      );

      // Check if invoice number already exists
      const existingInvoice = await Invoice.findOne({
        invoiceNumber: req.body.invoiceNumber,
      });
      if (existingInvoice) {
        return res
          .status(400)
          .json({ message: "Invoice number already exists" });
      }

      // Ensure numeric fields are properly set
      const invoiceData = {
        ...req.body,
        subtotal: Number(req.body.subtotal) || 0,
        total: Number(req.body.total) || 0,
        animalSections: req.body.animalSections.map((section) => ({
          ...section,
          subtotal: Number(section.subtotal) || 0,
          items: section.items.map((item) => ({
            ...item,
            quantity: Number(item.quantity) || 1,
            unitPrice: Number(item.unitPrice) || 0,
            total: Number(item.total) || 0,
          })),
        })),
      };

      const invoice = new Invoice(invoiceData);
      const newInvoice = await invoice.save();
      await newInvoice.populate("client", "firstName lastName");
      await newInvoice.populate("animalSections.animalId", "name species");
      res.status(201).json(transformInvoice(newInvoice));
    } catch (error) {
      res.status(400).json({ message: error.message });
    }
  }
);

// Update an invoice
router.put(
  "/:id",
  auth,
  requirePermission(PERMISSIONS.UPDATE_INVOICES),
  validateInvoice,
  async (req, res) => {
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

      // Ensure numeric fields are properly set
      const updateData = {
        ...req.body,
        subtotal: Number(req.body.subtotal) || 0,
        total: Number(req.body.total) || 0,
        animalSections: req.body.animalSections.map((section) => ({
          ...section,
          subtotal: Number(section.subtotal) || 0,
          items: section.items.map((item) => ({
            ...item,
            quantity: Number(item.quantity) || 1,
            unitPrice: Number(item.unitPrice) || 0,
            total: Number(item.total) || 0,
          })),
        })),
      };

      Object.assign(invoice, updateData);
      const updatedInvoice = await invoice.save();
      await updatedInvoice.populate("client", "firstName lastName");
      await updatedInvoice.populate("animalSections.animalId", "name species");
      res.json(transformInvoice(updatedInvoice));
    } catch (error) {
      res.status(400).json({ message: error.message });
    }
  }
);

// Update invoice status
router.patch(
  "/:id/status",
  auth,
  requirePermission(PERMISSIONS.UPDATE_INVOICES),
  async (req, res) => {
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
      await updatedInvoice.populate("animalSections.animalId", "name species");
      res.json(transformInvoice(updatedInvoice));
    } catch (error) {
      res.status(400).json({ message: error.message });
    }
  }
);

// Delete invoice
router.delete(
  "/:id",
  auth,
  requirePermission(PERMISSIONS.DELETE_INVOICES),
  async (req, res) => {
    try {
      const deletedInvoice = await Invoice.findByIdAndDelete(req.params.id);
      if (!deletedInvoice) {
        return res.status(404).json({ message: "Invoice not found" });
      }
      res.json({ message: "Invoice deleted successfully" });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }
);

export default router;
