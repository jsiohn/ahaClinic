import { body, validationResult } from "express-validator";

export const validateInvoice = [
  body("invoiceNumber")
    .trim()
    .notEmpty()
    .withMessage("Invoice number is required")
    .matches(/^[A-Z0-9-]+$/)
    .withMessage(
      "Invoice number can only contain uppercase letters, numbers, and hyphens"
    ),

  body("client")
    .notEmpty()
    .withMessage("Client ID is required")
    .isMongoId()
    .withMessage("Invalid client ID"),

  body("animal")
    .notEmpty()
    .withMessage("Animal ID is required")
    .isMongoId()
    .withMessage("Invalid animal ID"),

  body("date")
    .notEmpty()
    .withMessage("Date is required")
    .isISO8601()
    .withMessage("Invalid date format"),

  body("dueDate")
    .notEmpty()
    .withMessage("Due date is required")
    .isISO8601()
    .withMessage("Invalid date format")
    .custom((value, { req }) => {
      if (new Date(value) < new Date(req.body.date)) {
        throw new Error("Due date must be after the invoice date");
      }
      return true;
    }),

  body("items")
    .isArray({ min: 1 })
    .withMessage("At least one item is required"),

  body("items.*.description")
    .trim()
    .notEmpty()
    .withMessage("Item description is required"),

  body("items.*.quantity")
    .isInt({ min: 1 })
    .withMessage("Quantity must be at least 1"),

  body("items.*.unitPrice")
    .isFloat({ min: 0 })
    .withMessage("Unit price must be a positive number"),

  body("items.*.total")
    .isFloat({ min: 0 })
    .withMessage("Total must be a positive number"),

  body("subtotal")
    .isFloat({ min: 0 })
    .withMessage("Subtotal must be a positive number"),

  body("tax").isFloat({ min: 0 }).withMessage("Tax must be a positive number"),

  body("total")
    .isFloat({ min: 0 })
    .withMessage("Total must be a positive number"),

  body("status")
    .optional()
    .isIn(["draft", "sent", "paid", "overdue", "cancelled"])
    .withMessage("Invalid status"),

  body("paymentMethod")
    .optional()
    .isIn(["cash", "credit_card", "bank_transfer", "check", null])
    .withMessage("Invalid payment method"),

  body("paymentDate").optional().isISO8601().withMessage("Invalid date format"),

  body("notes").optional().trim(),

  // Validation result middleware
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    next();
  },
];
