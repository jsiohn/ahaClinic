import { body, validationResult } from "express-validator";

export const validateBlacklist = [
  body("client")
    .notEmpty()
    .withMessage("Client ID is required")
    .isMongoId()
    .withMessage("Invalid client ID"),

  body("reason")
    .trim()
    .notEmpty()
    .withMessage("Reason is required")
    .isLength({ min: 10, max: 500 })
    .withMessage("Reason must be between 10 and 500 characters"),

  body("addedBy")
    .trim()
    .notEmpty()
    .withMessage("Added by information is required")
    .isLength({ min: 2, max: 100 })
    .withMessage("Added by must be between 2 and 100 characters"),

  body("notes")
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage("Notes cannot exceed 1000 characters"),

  body("isActive")
    .optional()
    .isBoolean()
    .withMessage("isActive must be a boolean"),

  // Validation result middleware
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    next();
  },
];
