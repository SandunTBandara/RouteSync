const express = require("express");
const {
  getAllBuses,
  updateBusLocation,
} = require("../controllers/busController");
const router = express.Router();

/**
 * @swagger
 * components:
 *   schemas:
 *     Bus:
 *       type: object
 *       required:
 *         - busNumber
 *         - operatorId
 *         - routeId
 *         - capacity
 *         - busType
 *       properties:
 *         _id:
 *           type: string
 *           description: Unique identifier for the bus
 *         busNumber:
 *           type: string
 *           description: Bus registration number
 *         operatorId:
 *           type: string
 *           description: Bus operator reference ID
 *         routeId:
 *           type: string
 *           description: Route reference ID
 *         capacity:
 *           type: number
 *           description: Bus seating capacity
 *         busType:
 *           type: string
 *           enum: [Normal, Semi Luxury, Luxury, Super Luxury]
 *         currentLocation:
 *           type: object
 *           properties:
 *             type:
 *               type: string
 *               enum: [Point]
 *             coordinates:
 *               type: array
 *               items:
 *                 type: number
 *               description: [longitude, latitude]
 *         status:
 *           type: string
 *           enum: [active, inactive, maintenance]
 */

/**
 * @swagger
 * /buses:
 *   get:
 *     summary: Get all buses with real-time location data
 *     tags: [Buses]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *         description: Page number for pagination
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 20
 *         description: Number of buses per page
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [active, inactive, maintenance]
 *         description: Filter buses by status
 *       - in: query
 *         name: routeId
 *         schema:
 *           type: string
 *         description: Filter buses by route ID
 *     responses:
 *       200:
 *         description: List of buses retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 count:
 *                   type: number
 *                 totalPages:
 *                   type: number
 *                 currentPage:
 *                   type: number
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Bus'
 */
router.get("/", getAllBuses);

/**
 * @swagger
 * /buses/{id}/location:
 *   put:
 *     summary: Update bus GPS location (for tracking devices)
 *     tags: [Buses]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: Bus ID
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - latitude
 *               - longitude
 *             properties:
 *               latitude:
 *                 type: number
 *                 minimum: -90
 *                 maximum: 90
 *               longitude:
 *                 type: number
 *                 minimum: -180
 *                 maximum: 180
 *               timestamp:
 *                 type: string
 *                 format: date-time
 *               speed:
 *                 type: number
 *                 minimum: 0
 *               heading:
 *                 type: number
 *                 minimum: 0
 *                 maximum: 360
 *     responses:
 *       200:
 *         description: Bus location updated successfully
 *       400:
 *         description: Invalid coordinates provided
 *       404:
 *         description: Bus not found
 */
router.put("/:id/location", updateBusLocation);

module.exports = router;
