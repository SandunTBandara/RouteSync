const express = require("express");
const {
  getAllRoutes,
  getRoute,
  createRoute,
  updateRoute,
  deleteRoute,
  searchRoutes,
  getRouteStats,
  getBusesOnRoute,
  toggleRouteStatus,
} = require("../controllers/routeController");
const { protect, authorize } = require("../middleware/auth");
const {
  validateRoute,
  validateRouteUpdate,
} = require("../middleware/validation");
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
 *     Route:
 *       type: object
 *       required:
 *         - routeNumber
 *         - origin
 *         - destination
 *         - distance
 *         - estimatedDuration
 *       properties:
 *         _id:
 *           type: string
 *           description: MongoDB unique identifier for the route
 *         routeNumber:
 *           type: string
 *           description: Unique route number
 *           example: "87"
 *         origin:
 *           type: string
 *           description: Starting point of the route
 *           example: "Colombo"
 *         destination:
 *           type: string
 *           description: End point of the route
 *           example: "Kandy"
 *         distance:
 *           type: number
 *           description: Route distance in kilometers
 *           example: 116
 *         estimatedDuration:
 *           type: number
 *           description: Estimated duration in minutes
 *           example: 180
 *         isActive:
 *           type: boolean
 *           description: Whether the route is currently active
 *           default: true
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: Route creation timestamp
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           description: Route last update timestamp
 */

// Route Endpoints

/**
 * @swagger
 * /routes:
 *   get:
 *     summary: Get all routes (Admin only)
 *     tags: [Routes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *         description: Number of routes per page
 *       - in: query
 *         name: origin
 *         schema:
 *           type: string
 *         description: Filter by origin
 *       - in: query
 *         name: destination
 *         schema:
 *           type: string
 *         description: Filter by destination
 *       - in: query
 *         name: isActive
 *         schema:
 *           type: boolean
 *         description: Filter by active status
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search routes by number, origin, or destination
 *     responses:
 *       200:
 *         description: Routes retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 count:
 *                   type: integer
 *                   example: 3
 *                 totalPages:
 *                   type: integer
 *                   example: 1
 *                 currentPage:
 *                   type: integer
 *                   example: 1
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Route'
 *       500:
 *         description: Server Error
 */
router.get("/", protect, authorize("admin"), getAllRoutes);

/**
 * @swagger
 * /routes/stats:
 *   get:
 *     summary: Get route statistics
 *     tags: [Routes]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Route statistics retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     totalRoutes:
 *                       type: integer
 *                     activeRoutes:
 *                       type: integer
 *                     inactiveRoutes:
 *                       type: integer
 *                     totalDistance:
 *                       type: number
 *                     averageDistance:
 *                       type: number
 *       401:
 *         description: Not authorized
 *       403:
 *         description: Access denied - Admin only
 *       500:
 *         description: Server Error
 */
router.get("/stats", protect, authorize("admin"), getRouteStats);

/**
 * @swagger
 * /routes/{id}:
 *   get:
 *     summary: Get route by ID
 *     tags: [Routes]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Route ID
 *     responses:
 *       200:
 *         description: Route found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Route'
 *       404:
 *         description: Route not found
 *       500:
 *         description: Server Error
 */
router.get("/:id", getRoute);

/**
 * @swagger
 * /routes:
 *   post:
 *     summary: Create a new route
 *     tags: [Routes]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - routeNumber
 *               - origin
 *               - destination
 *               - distance
 *               - estimatedDuration
 *             properties:
 *               routeNumber:
 *                 type: string
 *                 example: "87"
 *                 description: Unique route number (uppercase letters, numbers, hyphens only)
 *               origin:
 *                 type: string
 *                 example: "Colombo"
 *                 description: Starting point of the route (2-100 characters)
 *               destination:
 *                 type: string
 *                 example: "Kandy"
 *                 description: End point of the route (2-100 characters)
 *               distance:
 *                 type: number
 *                 example: 116
 *                 description: Route distance in kilometers (0.1-1000)
 *               estimatedDuration:
 *                 type: number
 *                 example: 180
 *                 description: Estimated duration in minutes (1-1440)
 *               isActive:
 *                 type: boolean
 *                 default: true
 *                 description: Whether the route is active
 *     responses:
 *       201:
 *         description: Route created successfully
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
 *                   $ref: '#/components/schemas/Route'
 *       400:
 *         description: Validation error or route number already exists
 *       401:
 *         description: Not authorized
 *       403:
 *         description: Access denied - Admin only
 *       500:
 *         description: Server Error
 */
router.post(
  "/",
  protect,
  authorize("admin"),
  validateRoute,
  handleValidation,
  createRoute
);

/**
 * @swagger
 * /routes/{id}:
 *   put:
 *     summary: Update route information
 *     tags: [Routes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Route ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               routeNumber:
 *                 type: string
 *                 description: Unique route number (uppercase letters, numbers, hyphens only)
 *               origin:
 *                 type: string
 *                 description: Starting point of the route (2-100 characters)
 *               destination:
 *                 type: string
 *                 description: End point of the route (2-100 characters)
 *               distance:
 *                 type: number
 *                 description: Route distance in kilometers (0.1-1000)
 *               estimatedDuration:
 *                 type: number
 *                 description: Estimated duration in minutes (1-1440)
 *               isActive:
 *                 type: boolean
 *                 description: Whether the route is active
 *     responses:
 *       200:
 *         description: Route updated successfully
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
 *                   $ref: '#/components/schemas/Route'
 *       400:
 *         description: Validation error
 *       401:
 *         description: Not authorized
 *       403:
 *         description: Access denied - Admin only
 *       404:
 *         description: Route not found
 *       500:
 *         description: Server Error
 */
router.put(
  "/:id",
  protect,
  authorize("admin"),
  validateRouteUpdate,
  handleValidation,
  updateRoute
);

/**
 * @swagger
 * /routes/{id}:
 *   delete:
 *     summary: Delete a route
 *     tags: [Routes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Route ID
 *     responses:
 *       200:
 *         description: Route deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *       400:
 *         description: Cannot delete route with active buses
 *       401:
 *         description: Not authorized
 *       403:
 *         description: Access denied - Admin only
 *       404:
 *         description: Route not found
 *       500:
 *         description: Server Error
 */
router.delete("/:id", protect, authorize("admin"), deleteRoute);

/**
 * @swagger
 * /routes/{id}/buses:
 *   get:
 *     summary: Get all buses on a specific route
 *     tags: [Routes]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Route ID
 *     responses:
 *       200:
 *         description: Buses on route retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 count:
 *                   type: integer
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Bus'
 *       404:
 *         description: Route not found
 *       500:
 *         description: Server Error
 */
router.get("/:id/buses", getBusesOnRoute);

module.exports = router;
