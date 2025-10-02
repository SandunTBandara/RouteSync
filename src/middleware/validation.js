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
    .isIn(["admin", "user", "bus_operator"])
    .withMessage("Role must be one of: admin, user, bus_operator"),
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

/**
 * Validation for bus creation
 */
const validateBus = [
  body("busId")
    .not()
    .exists()
    .withMessage("busId is auto-generated and should not be provided"),

  body("busNumber")
    .trim()
    .isLength({ min: 1, max: 20 })
    .withMessage("Bus number is required and cannot exceed 20 characters")
    .matches(/^[A-Z0-9-]+$/)
    .withMessage(
      "Bus number can only contain uppercase letters, numbers, and hyphens"
    ),

  body("routeId").isMongoId().withMessage("Invalid route ID"),

  body("operatorId").isMongoId().withMessage("Invalid operator ID"),

  body("capacity")
    .isInt({ min: 1, max: 100 })
    .withMessage("Capacity must be between 1 and 100 passengers"),

  body("busType")
    .isIn(["Normal", "Semi Luxury", "Luxury", "Super Luxury"])
    .withMessage(
      "Bus type must be one of: Normal, Semi Luxury, Luxury, Super Luxury"
    ),
];

/**
 * Validation for bus updates
 */
const validateBusUpdate = [
  body("busId").not().exists().withMessage("busId cannot be modified"),

  body("busNumber")
    .optional()
    .trim()
    .isLength({ min: 1, max: 20 })
    .withMessage("Bus number cannot exceed 20 characters")
    .matches(/^[A-Z0-9-]+$/)
    .withMessage(
      "Bus number can only contain uppercase letters, numbers, and hyphens"
    ),

  body("routeId").optional().isMongoId().withMessage("Invalid route ID"),

  body("operatorId").optional().isMongoId().withMessage("Invalid operator ID"),

  body("capacity")
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage("Capacity must be between 1 and 100 passengers"),

  body("busType")
    .optional()
    .isIn(["Normal", "Semi Luxury", "Luxury", "Super Luxury"])
    .withMessage(
      "Bus type must be one of: Normal, Semi Luxury, Luxury, Super Luxury"
    ),

  body("status")
    .optional()
    .isIn(["active", "inactive", "maintenance"])
    .withMessage("Status must be one of: active, inactive, maintenance"),
];

/**
 * Validation for route creation
 */
const validateRoute = [
  body("routeNumber")
    .trim()
    .isLength({ min: 1, max: 10 })
    .withMessage("Route number is required and cannot exceed 10 characters")
    .matches(/^[A-Z0-9-]+$/)
    .withMessage(
      "Route number can only contain uppercase letters, numbers, and hyphens"
    ),

  body("origin")
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage("Origin is required and must be between 2-100 characters"),

  body("destination")
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage(
      "Destination is required and must be between 2-100 characters"
    ),

  body("distance")
    .isNumeric()
    .isFloat({ min: 0.1, max: 1000 })
    .withMessage("Distance must be a number between 0.1 and 1000 km"),

  body("estimatedDuration")
    .isNumeric()
    .isInt({ min: 1, max: 1440 })
    .withMessage("Estimated duration must be between 1 and 1440 minutes"),

  body("isActive")
    .optional()
    .isBoolean()
    .withMessage("isActive must be a boolean value"),
];

/**
 * Validation for route updates
 */
const validateRouteUpdate = [
  body("routeNumber")
    .optional()
    .trim()
    .isLength({ min: 1, max: 10 })
    .withMessage("Route number cannot exceed 10 characters")
    .matches(/^[A-Z0-9-]+$/)
    .withMessage(
      "Route number can only contain uppercase letters, numbers, and hyphens"
    ),

  body("origin")
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage("Origin must be between 2-100 characters"),

  body("destination")
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage("Destination must be between 2-100 characters"),

  body("distance")
    .optional()
    .isNumeric()
    .isFloat({ min: 0.1, max: 1000 })
    .withMessage("Distance must be a number between 0.1 and 1000 km"),

  body("estimatedDuration")
    .optional()
    .isNumeric()
    .isInt({ min: 1, max: 1440 })
    .withMessage("Estimated duration must be between 1 and 1440 minutes"),

  body("isActive")
    .optional()
    .isBoolean()
    .withMessage("isActive must be a boolean value"),
];

/**
 * Validation for bus location update
 */
const validateBusLocationUpdate = [
  body("longitude")
    .isFloat({ min: -180, max: 180 })
    .withMessage("Longitude must be between -180 and 180"),

  body("latitude")
    .isFloat({ min: -90, max: 90 })
    .withMessage("Latitude must be between -90 and 90"),

  body("speed")
    .optional()
    .isFloat({ min: 0, max: 300 })
    .withMessage("Speed must be between 0 and 300 km/h"),

  body("heading")
    .optional()
    .isFloat({ min: 0, max: 360 })
    .withMessage("Heading must be between 0 and 360 degrees"),

  body("timestamp")
    .optional()
    .isISO8601()
    .withMessage("Timestamp must be a valid ISO 8601 date"),
];

/**
 * Validation for nearby buses query
 */
const validateNearbyBuses = [
  body("latitude")
    .isFloat({ min: -90, max: 90 })
    .withMessage("Latitude must be between -90 and 90"),

  body("longitude")
    .isFloat({ min: -180, max: 180 })
    .withMessage("Longitude must be between -180 and 180"),

  body("radius")
    .optional()
    .isFloat({ min: 0.1, max: 100 })
    .withMessage("Radius must be between 0.1 and 100 km"),
];

module.exports = {
  validateRegister,
  validateLogin,
  validateProfileUpdate,
  validatePasswordChange,
  validateRefreshToken,
  validateLocationUpdate,
  validateBus,
  validateBusUpdate,
  validateRoute,
  validateRouteUpdate,
  validateBusLocationUpdate,
  validateNearbyBuses,
};
