import { body, validationResult } from "express-validator";

export const validateAnimal = [
  body("name")
    .trim()
    .notEmpty()
    .withMessage("Name is required")
    .isLength({ min: 2, max: 50 })
    .withMessage("Name must be between 2 and 50 characters"),

  body("species")
    .trim()
    .notEmpty()
    .withMessage("Species is required")
    .isIn(["DOG", "CAT", "OTHER"])
    .withMessage("Species must be DOG, CAT, or OTHER"),

  body("breed").optional().trim(),

  body("dateOfBirth").optional().isISO8601().withMessage("Invalid date format"),

  body("gender")
    .optional()
    .isIn(["male", "female", "unknown"])
    .withMessage("Gender must be male, female, or unknown"),

  body("weight")
    .optional({ nullable: true })
    .if((value) => value !== null) // Only validate if value is not null
    .isFloat({ min: 0 })
    .withMessage("Weight must be a positive number"),

  body("color").optional().trim(),

  body("microchipNumber").optional().trim(),
  body("client").optional().isMongoId().withMessage("Invalid client ID"),

  body("organization")
    .optional()
    .isMongoId()
    .withMessage("Invalid organization ID"),

  body("medicalHistory.*.date")
    .optional()
    .isISO8601()
    .withMessage("Invalid date format"),
  body("medicalHistory.*.description").optional().trim(),
  body("medicalHistory.*.diagnosis").optional().trim(),
  body("medicalHistory.*.treatment").optional().trim(),
  body("medicalHistory.*.veterinarian").optional().trim(),

  body("vaccinations.*.name").optional().trim(),
  body("vaccinations.*.date")
    .optional()
    .isISO8601()
    .withMessage("Invalid date format"),
  body("vaccinations.*.nextDueDate")
    .optional()
    .isISO8601()
    .withMessage("Invalid date format"),
  body("vaccinations.*.administeredBy").optional().trim(),

  body("notes").optional().trim(),
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
