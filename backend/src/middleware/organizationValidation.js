import { body, validationResult } from "express-validator";

export const validateOrganization = [
  body("name").trim().notEmpty().withMessage("Organization name is required"),

  body("contactPerson")
    .trim()
    .notEmpty()
    .withMessage("Contact person is required"),

  body("email")
    .trim()
    .isEmail()
    .withMessage("Must be a valid email address")
    .notEmpty()
    .withMessage("Email is required"),

  body("phone")
    .trim()
    .matches(/^[\d\s-()]+$/)
    .withMessage("Invalid phone number format")
    .notEmpty()
    .withMessage("Phone number is required"),

  body("address").trim().notEmpty().withMessage("Address is required"),

  body("status")
    .trim()
    .isIn(["ACTIVE", "INACTIVE", "PENDING"])
    .withMessage("Invalid status"),

  body("taxId")
    .optional()
    .trim()
    .matches(/^[0-9-]+$/)
    .withMessage("Tax ID can only contain numbers and hyphens"),

  /* Business hours validation to be implemented later:
  body("businessHours.monday.open")
    .optional()
    .matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
    .withMessage("Invalid time format (HH:MM)"),
  body("businessHours.monday.close")
    .optional()
    .matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
    .withMessage("Invalid time format (HH:MM)"),
  body("businessHours.tuesday.open")
    .optional()
    .matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
    .withMessage("Invalid time format (HH:MM)"),
  body("businessHours.tuesday.close")
    .optional()
    .matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
    .withMessage("Invalid time format (HH:MM)"),
  body("businessHours.wednesday.open")
    .optional()
    .matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
    .withMessage("Invalid time format (HH:MM)"),
  body("businessHours.wednesday.close")
    .optional()
    .matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
    .withMessage("Invalid time format (HH:MM)"),
  body("businessHours.thursday.open")
    .optional()
    .matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
    .withMessage("Invalid time format (HH:MM)"),
  body("businessHours.thursday.close")
    .optional()
    .matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
    .withMessage("Invalid time format (HH:MM)"),
  body("businessHours.friday.open")
    .optional()
    .matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
    .withMessage("Invalid time format (HH:MM)"),
  body("businessHours.friday.close")
    .optional()
    .matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
    .withMessage("Invalid time format (HH:MM)"),
  body("businessHours.saturday.open")
    .optional()
    .matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
    .withMessage("Invalid time format (HH:MM)"),
  body("businessHours.saturday.close")
    .optional()
    .matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
    .withMessage("Invalid time format (HH:MM)"),
  body("businessHours.sunday.open")
    .optional()
    .matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
    .withMessage("Invalid time format (HH:MM)"),
  body("businessHours.sunday.close")
    .optional()
    .matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
    .withMessage("Invalid time format (HH:MM)"),
  */

  // Validation result middleware
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    next();
  },
];
