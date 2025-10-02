const express = require("express");
const {
  getAllBuses,
  createBus,
  updateBus,
  deleteBus,
  updateBusLocation,
} = require("../controllers/busController");
const {
  protect,
  authorize,
  optionalAuth,
  checkBusAccess,
} = require("../middleware/auth");
const { validateBus, validateBusUpdate } = require("../middleware/validation");
const { validationResult } = require("express-validator");
const router = express.Router();

// Validation middleware to handle express-validator results
const handleValidation = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: "Validation failed",
      errors: errors.array(),
    });
  }
  next();
};

/**
 * @swagger
 * components:
 *   schemas:
 *     Bus:
 *       type: object
 *       required:
 *         - busNumber
 *         - routeId
 *         - capacity
 *         - busType
 *       properties:
 *         _id:
 *           type: string
 *           description: MongoDB unique identifier for the bus
 *         busId:
 *           type: string
 *           description: Auto-generated unique bus identifier (e.g., NTC123456)
 *           example: "NTC123456"
 *           readOnly: true
 *         busNumber:
 *           type: string
 *           description: Bus registration number

 *         routeId:
 *           type: string
 *           description: Route reference ID
 *         capacity:
 *           type: number
 *           description: Bus seating capacity
 *         busType:
 *           type: string
 *           enum: [Normal, Semi Luxury, Luxury, Super Luxury]
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
// Public endpoint with optional authentication for enhanced data
router.get("/", optionalAuth, getAllBuses);

/**
 * @swagger
 * /buses:
 *   post:
 *     summary: Create a new bus
 *     tags: [Buses]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - busNumber

 *               - routeId
 *               - capacity
 *               - busType
 *             properties:
 *               busNumber:
 *                 type: string
 *                 description: Unique bus registration number
 *                 example: "NB-1234"
 *                 pattern: "^[A-Z0-9-]+$"

 *               routeId:
 *                 type: string
 *                 description: Route ObjectId
 *                 example: "60d5ecb54b24a04c30c9a2f2"
 *               capacity:
 *                 type: integer
 *                 minimum: 1
 *                 maximum: 100
 *                 description: Bus seating capacity
 *                 example: 45
 *               busType:
 *                 type: string
 *                 enum: [Normal, Semi Luxury, Luxury, Super Luxury]
 *                 description: Type of bus service
 *                 example: "Semi Luxury"
 *     responses:
 *       201:
 *         description: Bus created successfully
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
 *                   example: "Bus created successfully"
 *                 data:
 *                   $ref: '#/components/schemas/Bus'
 *       400:
 *         description: Validation error or bus number already exists
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: "Bus with this number already exists"
 *       401:
 *         description: Unauthorized - Authentication required
 *       403:
 *         description: Forbidden - Admin role required
 *       500:
 *         description: Internal server error
 */
// Only admin can create buses
router.post(
  "/",
  protect,
  authorize("admin"),
  validateBus,
  handleValidation,
  createBus
);

/**
 * @swagger
 * /buses/{id}:
 *   put:
 *     summary: Update bus information
 *     tags: [Buses]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: Bus MongoDB ObjectId
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               busNumber:
 *                 type: string
 *                 description: Bus registration number
 *                 example: "NB-1234"
 *                 pattern: "^[A-Z0-9-]+$"
 *               routeId:
 *                 type: string
 *                 description: Route ObjectId
 *                 example: "60d5ecb54b24a04c30c9a2f2"
 *               capacity:
 *                 type: integer
 *                 minimum: 1
 *                 maximum: 100
 *                 description: Bus seating capacity
 *                 example: 45
 *               busType:
 *                 type: string
 *                 enum: [Normal, Semi Luxury, Luxury, Super Luxury]
 *                 description: Type of bus service
 *                 example: "Semi Luxury"
 *               status:
 *                 type: string
 *                 enum: [active, inactive, maintenance]
 *                 description: Bus operational status
 *                 example: "active"
 *     responses:
 *       200:
 *         description: Bus updated successfully
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
 *                   example: "Bus updated successfully"
 *                 data:
 *                   $ref: '#/components/schemas/Bus'
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized - Authentication required
 *       403:
 *         description: Forbidden - Admin role required
 *       404:
 *         description: Bus not found
 *       500:
 *         description: Internal server error
 */
// Only admin can update buses
router.put(
  "/:id",
  protect,
  authorize("admin"),
  validateBusUpdate,
  handleValidation,
  updateBus
);

/**
 * @swagger
 * /buses/{id}:
 *   delete:
 *     summary: Delete a bus
 *     tags: [Buses]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: Bus MongoDB ObjectId
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Bus deleted successfully
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
 *                   example: "Bus deleted successfully"
 *       401:
 *         description: Unauthorized - Authentication required
 *       403:
 *         description: Forbidden - Admin role required
 *       404:
 *         description: Bus not found
 *       500:
 *         description: Internal server error
 */
// Only admin can delete buses
router.delete("/:id", protect, authorize("admin"), deleteBus);

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
// Bus operator or admin can update bus location
router.put(
  "/:id/location",
  protect,
  authorize("user", "admin", "bus_operator"),
  checkBusAccess,
  updateBusLocation
);

module.exports = router;
