const express = require("express");
const router = express.Router();
const locationController = require("../controllers/locationController");
const { authenticate } = require("../middleware/auth");
const { validateBusLocationUpdate } = require("../middleware/validation");
const { param } = require("express-validator");

/**
 * @swagger
 * components:
 *   schemas:
 *     LocationUpdate:
 *       type: object
 *       required:
 *         - longitude
 *         - latitude
 *       properties:
 *         longitude:
 *           type: number
 *           minimum: -180
 *           maximum: 180
 *           description: Longitude coordinate
 *           example: 79.8612
 *         latitude:
 *           type: number
 *           minimum: -90
 *           maximum: 90
 *           description: Latitude coordinate
 *           example: 6.9271
 *         speed:
 *           type: number
 *           minimum: 0
 *           maximum: 300
 *           description: Speed in km/h
 *           example: 45
 *         heading:
 *           type: number
 *           minimum: 0
 *           maximum: 360
 *           description: Heading in degrees
 *           example: 180
 *         timestamp:
 *           type: string
 *           format: date-time
 *           description: Timestamp of the location
 *           example: "2023-12-01T10:30:00Z"
 *
 *     LocationResponse:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *           description: Location record ID
 *         busId:
 *           type: string
 *           description: Bus ID
 *         location:
 *           type: object
 *           properties:
 *             locationType:
 *               type: string
 *               example: "Point"
 *             coordinates:
 *               type: array
 *               items:
 *                 type: number
 *               example: [79.8612, 6.9271]
 *         speed:
 *           type: number
 *           example: 45
 *         heading:
 *           type: number
 *           example: 180
 *         timestamp:
 *           type: string
 *           format: date-time
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 */

// Validation middleware for bus ID parameter
const validateBusId = [
  param("busId").isMongoId().withMessage("Invalid bus ID format"),
];

// Validation middleware for date parameter
const validateDateParam = [
  param("date")
    .matches(/^\d{4}-\d{2}-\d{2}$/)
    .withMessage("Date must be in YYYY-MM-DD format"),
];

// Validation middleware for nearby buses query
const validateNearbyQuery = [
  query("latitude")
    .isFloat({ min: -90, max: 90 })
    .withMessage("Latitude must be between -90 and 90"),

  query("longitude")
    .isFloat({ min: -180, max: 180 })
    .withMessage("Longitude must be between -180 and 180"),

  query("radius")
    .optional()
    .isFloat({ min: 0.1, max: 100 })
    .withMessage("Radius must be between 0.1 and 100 km"),
];

/**
 * @swagger
 * /api/locations/bus/{busId}/date/{date}:
 *   get:
 *     summary: Get location tracking details for a bus on a specific date
 *     tags: [Locations]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: busId
 *         required: true
 *         schema:
 *           type: string
 *         description: Bus ID
 *       - in: path
 *         name: date
 *         required: true
 *         schema:
 *           type: string
 *           pattern: '^\d{4}-\d{2}-\d{2}$'
 *         description: Date in YYYY-MM-DD format
 *         example: "2023-12-01"
 *     responses:
 *       200:
 *         description: Location tracking details retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                 data:
 *                   type: object
 *                   properties:
 *                     busId:
 *                       type: string
 *                     date:
 *                       type: string
 *                     totalRecords:
 *                       type: number
 *                     locations:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/LocationResponse'
 *       400:
 *         description: Bad request - Invalid date format
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Bus not found
 *       500:
 *         description: Internal server error
 */
router.get(
  "/bus/:busId/date/:date",
  authenticate,
  validateBusId,
  validateDateParam,
  locationController.getLocationsByBusAndDate
);

/**
 * @swagger
 * /api/locations/bus/{busId}/update:
 *   post:
 *     summary: Update bus location with timestamp, longitude, latitude, and speed
 *     tags: [Locations]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: busId
 *         required: true
 *         schema:
 *           type: string
 *         description: Bus ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/LocationUpdate'
 *     responses:
 *       201:
 *         description: Bus location updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                 data:
 *                   type: object
 *                   properties:
 *                     busId:
 *                       type: string
 *                     location:
 *                       $ref: '#/components/schemas/LocationResponse'
 *                     timestamp:
 *                       type: string
 *                       format: date-time
 *                     coordinates:
 *                       type: object
 *                       properties:
 *                         longitude:
 *                           type: number
 *                         latitude:
 *                           type: number
 *                     speed:
 *                       type: number
 *                     heading:
 *                       type: number
 *       400:
 *         description: Bad request - Invalid coordinates
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Bus not found
 *       500:
 *         description: Internal server error
 */
router.post(
  "/bus/:busId/update",
  authenticate,
  validateBusId,
  validateBusLocationUpdate,
  locationController.updateBusLocation
);

/**
 * @swagger
 * /api/locations/bus/{busId}/update:
 *   put:
 *     summary: Update bus location (alternative PUT method)
 *     tags: [Locations]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: busId
 *         required: true
 *         schema:
 *           type: string
 *         description: Bus ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/LocationUpdate'
 *     responses:
 *       201:
 *         description: Bus location updated successfully
 *       400:
 *         description: Bad request - Invalid coordinates
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Bus not found
 *       500:
 *         description: Internal server error
 */
router.put(
  "/bus/:busId/update",
  authenticate,
  validateBusId,
  validateBusLocationUpdate,
  locationController.updateBusLocation
);

/**
 * @swagger
 * /api/locations/bus/{busId}/latest:
 *   get:
 *     summary: Get latest location for a specific bus
 *     tags: [Locations]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: busId
 *         required: true
 *         schema:
 *           type: string
 *         description: Bus ID
 *     responses:
 *       200:
 *         description: Latest bus location retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                 data:
 *                   type: object
 *                   properties:
 *                     busId:
 *                       type: string
 *                     location:
 *                       $ref: '#/components/schemas/LocationResponse'
 *                     coordinates:
 *                       type: object
 *                       properties:
 *                         longitude:
 *                           type: number
 *                         latitude:
 *                           type: number
 *                     speed:
 *                       type: number
 *                     heading:
 *                       type: number
 *                     timestamp:
 *                       type: string
 *                       format: date-time
 *                     lastUpdated:
 *                       type: string
 *                       format: date-time
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Bus not found
 *       500:
 *         description: Internal server error
 */
router.get(
  "/bus/:busId/latest",
  authenticate,
  validateBusId,
  locationController.getLatestBusLocation
);

/**
 * @swagger
 * /api/locations/bus/{busId}/history:
 *   get:
 *     summary: Get location history for a bus with pagination
 *     tags: [Locations]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: busId
 *         required: true
 *         schema:
 *           type: string
 *         description: Bus ID
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 50
 *         description: Number of records per page
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Start date for filtering
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *         description: End date for filtering
 *     responses:
 *       200:
 *         description: Bus location history retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                 data:
 *                   type: object
 *                   properties:
 *                     busId:
 *                       type: string
 *                     locations:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/LocationResponse'
 *                     pagination:
 *                       type: object
 *                       properties:
 *                         totalLocations:
 *                           type: number
 *                         totalPages:
 *                           type: number
 *                         currentPage:
 *                           type: number
 *                         count:
 *                           type: number
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Bus not found
 *       500:
 *         description: Internal server error
 */
router.get(
  "/bus/:busId/history",
  authenticate,
  validateBusId,
  locationController.getBusLocationHistory
);

/**
 * @swagger
 * /api/locations/buses/active:
 *   get:
 *     summary: Get all active bus locations
 *     tags: [Locations]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 100
 *         description: Maximum number of buses to return
 *     responses:
 *       200:
 *         description: Active bus locations retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                 data:
 *                   type: object
 *                   properties:
 *                     totalBuses:
 *                       type: number
 *                     locations:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/LocationResponse'
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
router.get(
  "/buses/active",
  authenticate,
  locationController.getAllActiveBusLocations
);

/**
 * @swagger
 * /api/locations/nearby:
 *   get:
 *     summary: Get buses near a specific location
 *     tags: [Locations]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: latitude
 *         required: true
 *         schema:
 *           type: number
 *           minimum: -90
 *           maximum: 90
 *         description: Latitude coordinate
 *         example: 6.9271
 *       - in: query
 *         name: longitude
 *         required: true
 *         schema:
 *           type: number
 *           minimum: -180
 *           maximum: 180
 *         description: Longitude coordinate
 *         example: 79.8612
 *       - in: query
 *         name: radius
 *         schema:
 *           type: number
 *           default: 5
 *           minimum: 0.1
 *           maximum: 100
 *         description: Search radius in kilometers
 *     responses:
 *       200:
 *         description: Nearby buses retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                 data:
 *                   type: object
 *                   properties:
 *                     searchLocation:
 *                       type: object
 *                       properties:
 *                         latitude:
 *                           type: number
 *                         longitude:
 *                           type: number
 *                     radius:
 *                       type: number
 *                     totalBuses:
 *                       type: number
 *                     buses:
 *                       type: array
 *                       items:
 *                         allOf:
 *                           - $ref: '#/components/schemas/LocationResponse'
 *                           - type: object
 *                             properties:
 *                               distance:
 *                                 type: number
 *                                 description: Distance in kilometers
 *       400:
 *         description: Bad request - Invalid coordinates
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
router.get(
  "/nearby",
  authenticate,
  validateNearbyQuery,
  locationController.getBusesNearLocation
);

/**
 * @swagger
 * /api/locations/bus/{busId}/stats:
 *   get:
 *     summary: Get location statistics for a bus
 *     tags: [Locations]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: busId
 *         required: true
 *         schema:
 *           type: string
 *         description: Bus ID
 *     responses:
 *       200:
 *         description: Bus location statistics retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                 data:
 *                   type: object
 *                   properties:
 *                     busId:
 *                       type: string
 *                     overall:
 *                       type: object
 *                       properties:
 *                         totalRecords:
 *                           type: number
 *                         avgSpeed:
 *                           type: number
 *                         maxSpeed:
 *                           type: number
 *                         firstRecord:
 *                           type: string
 *                           format: date-time
 *                         lastRecord:
 *                           type: string
 *                           format: date-time
 *                     dailyStats:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           _id:
 *                             type: string
 *                             description: Date in YYYY-MM-DD format
 *                           count:
 *                             type: number
 *                           avgSpeed:
 *                             type: number
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Bus not found
 *       500:
 *         description: Internal server error
 */
router.get(
  "/bus/:busId/stats",
  authenticate,
  validateBusId,
  locationController.getBusLocationStats
);

module.exports = router;
