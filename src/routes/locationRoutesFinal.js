const express = require("express");
const router = express.Router();
const locationController = require("../controllers/locationController");
const { protect } = require("../middleware/auth");
// Test route (no authentication required)
router.get("/test", (req, res) => {
  res.json({
    success: true,
    message: "Location routes are working!",
    timestamp: new Date().toISOString(),
  });
});

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
 *         latitude:
 *           type: number
 *           minimum: -90
 *           maximum: 90
 *         speed:
 *           type: number
 *           minimum: 0
 *         heading:
 *           type: number
 *           minimum: 0
 *           maximum: 360
 *         timestamp:
 *           type: string
 *           format: date-time
 */

/**
 * @swagger
 * /locations/bus/{busId}/date/{date}:
 *   get:
 *     summary: Get location tracking details for a bus on a specific date
 *     tags: [Locations]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: busId
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *       - name: date
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *           pattern: '^\d{4}-\d{2}-\d{2}$'
 *         example: "2023-12-01"
 *     responses:
 *       200:
 *         description: Location tracking details retrieved successfully
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Bus not found
 */
router.get(
  "/bus/:busId/date/:date",
  protect,
  locationController.getLocationsByBusAndDate
);

/**
 * @swagger
 * /locations/bus/{busId}/update:
 *   post:
 *     summary: Update bus location with timestamp, longitude, latitude, and speed
 *     tags: [Locations]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: busId
 *         in: path
 *         required: true
 *         schema:
 *           type: string
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
 *         description: Bad request
 *       401:
 *         description: Unauthorized
 */
router.post(
  "/bus/:busId/update",
  protect,
  locationController.updateBusLocation
);

/**
 * @swagger
 * /locations/bus/{busId}/update:
 *   put:
 *     summary: Update bus location (PUT method)
 *     tags: [Locations]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: busId
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/LocationUpdate'
 *     responses:
 *       201:
 *         description: Bus location updated successfully
 */
router.put("/bus/:busId/update", protect, locationController.updateBusLocation);

/**
 * @swagger
 * /locations/bus/{busId}/latest:
 *   get:
 *     summary: Get latest location for a specific bus
 *     tags: [Locations]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: busId
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *         description: Bus ID to get location for
 *       - name: date
 *         in: query
 *         required: false
 *         schema:
 *           type: string
 *           format: date
 *         description: Date to get latest location for (YYYY-MM-DD). If not provided, returns overall latest location.
 *         example: "2025-10-08"
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
 *                 message:
 *                   type: string
 *                 data:
 *                   type: object
 *                   properties:
 *                     busId:
 *                       type: string
 *                     location:
 *                       type: object
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
 *       400:
 *         description: Invalid date format or validation error
 *       404:
 *         description: No location found for the specified bus and date
 */
router.get(
  "/bus/:busId/latest",
  protect,
  locationController.getLatestBusLocation
);

/**
 * @swagger
 * /locations/bus/{busId}/history:
 *   get:
 *     summary: Get location history for a bus with pagination
 *     tags: [Locations]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: busId
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *       - name: limit
 *         in: query
 *         schema:
 *           type: integer
 *           default: 50
 *       - name: page
 *         in: query
 *         schema:
 *           type: integer
 *           default: 1
 *     responses:
 *       200:
 *         description: Bus location history retrieved successfully
 */
router.get(
  "/bus/:busId/history",
  protect,
  locationController.getBusLocationHistory
);

/**
 * @swagger
 * /locations/buses/active:
 *   get:
 *     summary: Get all active bus locations
 *     tags: [Locations]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Active bus locations retrieved successfully
 */
router.get(
  "/buses/active",
  protect,
  locationController.getAllActiveBusLocations
);

module.exports = router;
