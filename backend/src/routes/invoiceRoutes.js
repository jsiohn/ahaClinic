import express from "express";
import Invoice from "../models/Invoice.js";
import Client from "../models/Client.js";
import Organization from "../models/Organization.js";
import { validateInvoice } from "../middleware/invoiceValidation.js";
import { auth, requirePermission } from "../middleware/auth.js";
import { PERMISSIONS } from "../config/roles.js";

const router = express.Router();

// Helper function to populate client/organization data - supports both clients and organizations
const populateClientOrOrganization = async (invoice) => {
  try {
    // First, try to find it as a Client
    const client = await Client.findById(invoice.client).select(
      "firstName lastName address.street address.city address.state address.zipCode address.country address.county"
    );

    if (client) {
      // It's a client - create a new invoice object with the client data
      const invoiceObj = invoice.toObject();
      invoiceObj.client = client.toObject();
      return invoiceObj;
    }

    // If not found as client, try to find as organization
    const organization = await Organization.findById(invoice.client).select(
      "name address.street address.city address.state address.zipCode address.country address.county"
    );

    if (organization) {
      // It's an organization - format it like a client object for consistency
      const invoiceObj = invoice.toObject();
      invoiceObj.client = {
        name: organization.name,
        address: organization.address,
        _id: organization._id,
      };
      return invoiceObj;
    }

    // If neither found, return with null client
    const invoiceObj = invoice.toObject();
    invoiceObj.client = null;
    return invoiceObj;
  } catch (error) {
    console.error("Error populating client/organization:", error);
    return invoice.toObject();
  }
};

const transformInvoice = (invoice) => {
  // invoice is now already a plain object from populateClientOrOrganization
  const invoiceObj = invoice.toObject
    ? invoice.toObject({ getters: true })
    : invoice;
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

// Debug endpoint for production troubleshooting
router.get(
  "/debug",
  auth,
  requirePermission(PERMISSIONS.READ_INVOICES),
  async (req, res) => {
    try {
      const start = Date.now();

      // Basic database connection check
      const dbStatus = await Invoice.db.db.admin().ping();

      // Count invoices
      const totalInvoices = await Invoice.countDocuments();

      // Get sample invoice if any exist
      let sampleInvoice = null;
      if (totalInvoices > 0) {
        sampleInvoice = await Invoice.findOne()
          .populate("client", "firstName lastName")
          .populate("animalSections.animalId", "name species");
      }

      // Check different data formats
      const formats = {
        withAnimalSections: await Invoice.countDocuments({
          animalSections: { $exists: true },
        }),
        withOldAnimal: await Invoice.countDocuments({
          animal: { $exists: true },
        }),
        withAnimalsArray: await Invoice.countDocuments({
          animals: { $exists: true },
        }),
        withoutClient: await Invoice.countDocuments({
          client: { $exists: false },
        }),
        withEmptyAnimalSections: await Invoice.countDocuments({
          animalSections: { $size: 0 },
        }),
      };

      const responseTime = Date.now() - start;

      res.json({
        timestamp: new Date().toISOString(),
        database: {
          connected: !!dbStatus,
          responseTime: `${responseTime}ms`,
        },
        invoices: {
          total: totalInvoices,
          formats,
          sample: sampleInvoice
            ? {
                id: sampleInvoice._id,
                invoiceNumber: sampleInvoice.invoiceNumber,
                hasClient: !!sampleInvoice.client,
                clientPopulated: typeof sampleInvoice.client === "object",
                animalSectionsCount: sampleInvoice.animalSections?.length || 0,
                firstAnimalPopulated: sampleInvoice.animalSections?.[0]
                  ?.animalId
                  ? typeof sampleInvoice.animalSections[0].animalId === "object"
                  : false,
              }
            : null,
        },
        environment: {
          nodeEnv: process.env.NODE_ENV,
          mongoUri: process.env.MONGODB_URI ? "SET" : "NOT_SET",
        },
      });
    } catch (error) {
      console.error("Debug endpoint error:", error);
      res.status(500).json({
        error: error.message,
        stack: process.env.NODE_ENV === "development" ? error.stack : undefined,
      });
    }
  }
);

// Get all invoices
router.get(
  "/",
  auth,
  requirePermission(PERMISSIONS.READ_INVOICES),
  async (req, res) => {
    try {
      const invoices = await Invoice.find().populate(
        "animalSections.animalId",
        "name species"
      );

      // Populate client/organization data for each invoice
      const populatedInvoices = await Promise.all(
        invoices.map(async (invoice) => {
          return await populateClientOrOrganization(invoice);
        })
      );

      const transformedInvoices = populatedInvoices.map(transformInvoice);

      res.json(transformedInvoices);
    } catch (error) {
      console.error("Error fetching invoices:", error);
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
      const invoices = await Invoice.find({
        client: req.params.clientId,
      }).populate("animalSections.animalId", "name species");

      // Populate client/organization data for each invoice
      const populatedInvoices = await Promise.all(
        invoices.map(async (invoice) => {
          return await populateClientOrOrganization(invoice);
        })
      );

      const transformedInvoices = populatedInvoices.map(transformInvoice);
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
      const invoice = await Invoice.findById(req.params.id).populate(
        "animalSections.animalId",
        "name species"
      );

      if (!invoice) {
        return res.status(404).json({ message: "Invoice not found" });
      }

      const populatedInvoice = await populateClientOrOrganization(invoice);
      res.json(transformInvoice(populatedInvoice));
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
      await newInvoice.populate("animalSections.animalId", "name species");

      const populatedInvoice = await populateClientOrOrganization(newInvoice);
      res.status(201).json(transformInvoice(populatedInvoice));
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
      await updatedInvoice.populate("animalSections.animalId", "name species");

      const populatedInvoice = await populateClientOrOrganization(
        updatedInvoice
      );
      res.json(transformInvoice(populatedInvoice));
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
      await updatedInvoice.populate("animalSections.animalId", "name species");

      const populatedInvoice = await populateClientOrOrganization(
        updatedInvoice
      );
      res.json(transformInvoice(populatedInvoice));
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
