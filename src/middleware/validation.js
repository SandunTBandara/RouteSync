const { body } = require("express-validator");

/**
 * Validation for user registration
 */
const validateRegister = [
  body("username")
    .trim()
    .isLength({ min: 3, max: 30 })
    .withMessage("Username must be between 3 and 30 characters")
    .matches(/^[a-zA-Z0-9_]+$/)
    .withMessage("Username can only contain letters, numbers, and underscores"),

  body("email")
    .isEmail()
    .normalizeEmail()
    .withMessage("Please provide a valid email address"),

  body("password")
    .isLength({ min: 6 })
    .withMessage("Password must be at least 6 characters long")
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage(
      "Password must contain at least one uppercase letter, one lowercase letter, and one number"
    ),

  body("firstName")
    .trim()
    .isLength({ min: 1, max: 50 })
    .withMessage("First name is required and cannot exceed 50 characters"),

  body("lastName")
    .trim()
    .isLength({ min: 1, max: 50 })
    .withMessage("Last name is required and cannot exceed 50 characters"),

  body("phone")
    .matches(/^\+94\d{9}$/)
    .withMessage(
      "Please provide a valid Sri Lankan phone number (+94xxxxxxxxx)"
    ),

  body("role")
    .optional()
    .isIn(["admin", "operator", "driver", "user"])
    .withMessage("Role must be one of: admin, operator, driver, user"),

  body("operatorId").optional().isMongoId().withMessage("Invalid operator ID"),

  body("assignedBusId").optional().isMongoId().withMessage("Invalid bus ID"),
];

/**
 * Validation for user login
 */
const validateLogin = [
  body("login")
    .trim()
    .isLength({ min: 1 })
    .withMessage("Email or username is required"),

  body("password").isLength({ min: 1 }).withMessage("Password is required"),
];

/**
 * Validation for profile update
 */
const validateProfileUpdate = [
  body("firstName")
    .optional()
    .trim()
    .isLength({ min: 1, max: 50 })
    .withMessage("First name cannot exceed 50 characters"),

  body("lastName")
    .optional()
    .trim()
    .isLength({ min: 1, max: 50 })
    .withMessage("Last name cannot exceed 50 characters"),

  body("phone")
    .optional()
    .matches(/^\+94\d{9}$/)
    .withMessage(
      "Please provide a valid Sri Lankan phone number (+94xxxxxxxxx)"
    ),
];

/**
 * Validation for password change
 */
const validatePasswordChange = [
  body("currentPassword")
    .isLength({ min: 1 })
    .withMessage("Current password is required"),

  body("newPassword")
    .isLength({ min: 6 })
    .withMessage("New password must be at least 6 characters long")
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage(
      "New password must contain at least one uppercase letter, one lowercase letter, and one number"
    ),
];

/**
 * Validation for refresh token
 */
const validateRefreshToken = [
  body("refreshToken")
    .isLength({ min: 1 })
    .withMessage("Refresh token is required"),
];

/**
 * Validation for operator creation
 */
const validateOperator = [
  body("name")
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage("Operator name is required and cannot exceed 100 characters"),

  body("registrationNumber")
    .trim()
    .isLength({ min: 1 })
    .withMessage("Registration number is required"),

  body("contactInfo.phone")
    .matches(/^\+94\d{9}$/)
    .withMessage("Please provide a valid Sri Lankan phone number"),

  body("contactInfo.email")
    .optional()
    .isEmail()
    .normalizeEmail()
    .withMessage("Please provide a valid email address"),

  body("licenseInfo.licenseNumber")
    .trim()
    .isLength({ min: 1 })
    .withMessage("License number is required"),

  body("licenseInfo.issueDate")
    .isISO8601()
    .withMessage("Please provide a valid issue date"),

  body("licenseInfo.expiryDate")
    .isISO8601()
    .withMessage("Please provide a valid expiry date")
    .custom((value, { req }) => {
      if (new Date(value) <= new Date(req.body.licenseInfo.issueDate)) {
        throw new Error("Expiry date must be after issue date");
      }
      return true;
    }),
];

/**
 * Validation for location update
 */
const validateLocationUpdate = [
  body("latitude")
    .isFloat({ min: -90, max: 90 })
    .withMessage("Latitude must be between -90 and 90"),

  body("longitude")
    .isFloat({ min: -180, max: 180 })
    .withMessage("Longitude must be between -180 and 180"),

  body("speed")
    .optional()
    .isFloat({ min: 0 })
    .withMessage("Speed must be a positive number"),

  body("heading")
    .optional()
    .isFloat({ min: 0, max: 360 })
    .withMessage("Heading must be between 0 and 360 degrees"),

  body("accuracy")
    .optional()
    .isFloat({ min: 0 })
    .withMessage("Accuracy must be a positive number"),
];

module.exports = {
  validateRegister,
  validateLogin,
  validateProfileUpdate,
  validatePasswordChange,
  validateRefreshToken,
  validateOperator,
  validateLocationUpdate,
};
