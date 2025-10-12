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
      "firstName lastName email address.street address.city address.state address.zipCode address.country address.county"
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

// Send invoice PDF via email
router.post(
  "/send-email",
  auth,
  requirePermission(PERMISSIONS.READ_INVOICES),
  async (req, res) => {
    try {
      const { invoiceId, email, pdfBase64 } = req.body;

      // Validate required fields
      if (!invoiceId || !email || !pdfBase64) {
        return res.status(400).json({
          message: "Missing required fields: invoiceId, email, and pdfBase64",
        });
      }

      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return res.status(400).json({
          message: "Invalid email address format",
        });
      }

      // Find the invoice
      const invoice = await Invoice.findById(invoiceId);
      if (!invoice) {
        return res.status(404).json({ message: "Invoice not found" });
      }

      // Check if email is configured
      if (
        !process.env.EMAIL_USER ||
        !process.env.EMAIL_APP_PASSWORD ||
        process.env.EMAIL_USER === "your-email@gmail.com" ||
        process.env.EMAIL_APP_PASSWORD === "your-app-specific-password"
      ) {
        return res.status(500).json({
          message:
            "Email service not configured. Please set EMAIL_USER and EMAIL_APP_PASSWORD in environment variables.",
          error: "Email configuration missing",
        });
      }

      // Import nodemailer
      const nodemailer = await import("nodemailer");

      // Create transporter - auto-detect service or use custom SMTP
      let transporterConfig;

      if (process.env.EMAIL_SERVICE) {
        // Use specific service (gmail, outlook, etc.)
        transporterConfig = {
          service: process.env.EMAIL_SERVICE,
          auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_APP_PASSWORD,
          },
        };
      } else if (process.env.EMAIL_HOST) {
        // Use custom SMTP settings
        transporterConfig = {
          host: process.env.EMAIL_HOST,
          port: process.env.EMAIL_PORT || 587,
          secure: process.env.EMAIL_SECURE === "true", // true for 465, false for other ports
          auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_APP_PASSWORD,
          },
        };
      } else {
        // Default to Gmail
        transporterConfig = {
          service: "gmail",
          auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_APP_PASSWORD,
          },
        };
      }

      const transporter =
        nodemailer.default.createTransporter(transporterConfig);

      // Convert base64 back to buffer
      const pdfBuffer = Buffer.from(pdfBase64, "base64");

      // Email options
      const mailOptions = {
        from: process.env.EMAIL_USER,
        to: email,
        subject: `Invoice ${invoice.invoiceNumber} - AHA Clinic`,
        text: `Please find attached your invoice #${invoice.invoiceNumber}.

Thank you for your business!

AHA Clinic`,
        html: `
          <h2>Invoice #${invoice.invoiceNumber}</h2>
          <p>Dear Valued Client,</p>
          <p>Please find attached your invoice #${invoice.invoiceNumber}.</p>
          <p>Thank you for your business!</p>
          <br>
          <p>Best regards,<br>AHA Clinic</p>
        `,
        attachments: [
          {
            filename: `Invoice-${invoice.invoiceNumber}.pdf`,
            content: pdfBuffer,
            contentType: "application/pdf",
          },
        ],
      };

      // Send email
      console.log(`Attempting to send email to: ${email}`);
      const result = await transporter.sendMail(mailOptions);
      console.log("Email sent successfully:", result.messageId);

      res.json({
        message: `Invoice PDF sent successfully to ${email}`,
        invoiceNumber: invoice.invoiceNumber,
        messageId: result.messageId,
      });
    } catch (error) {
      console.error("Email sending error:", error);
      console.error("Error details:", {
        message: error.message,
        code: error.code,
        command: error.command,
      });
      res.status(500).json({
        message: "Failed to send email",
        error: error.message,
        details: error.code || "Unknown error code",
      });
    }
  }
);

export default router;
