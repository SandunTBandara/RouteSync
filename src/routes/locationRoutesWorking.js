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
 *     LocationResponse:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *         busId:
 *           type: string
 *         location:
 *           type: object
 *           properties:
 *             coordinates:
 *               type: array
 *               items:
 *                 type: number
 *         speed:
 *           type: number
 *         heading:
 *           type: number
 *         timestamp:
 *           type: string
 *           format: date-time
 */

// Simple validation
const validateBusId = param("busId").isMongoId().withMessage("Invalid bus ID");

/**
 * @swagger
 * /api/locations/bus/{busId}/date/{date}:
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
 *     responses:
 *       200:
 *         description: Success
 */
router.get(
  "/bus/:busId/date/:date",
  authenticate,
  validateBusId,
  locationController.getLocationsByBusAndDate
);

/**
 * @swagger
 * /api/locations/bus/{busId}/update:
 *   post:
 *     summary: Update bus location
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
 *             type: object
 *             required:
 *               - longitude
 *               - latitude
 *             properties:
 *               longitude:
 *                 type: number
 *               latitude:
 *                 type: number
 *               speed:
 *                 type: number
 *               heading:
 *                 type: number
 *     responses:
 *       201:
 *         description: Location updated
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
 *             type: object
 *             required:
 *               - longitude
 *               - latitude
 *             properties:
 *               longitude:
 *                 type: number
 *               latitude:
 *                 type: number
 *               speed:
 *                 type: number
 *               heading:
 *                 type: number
 *     responses:
 *       201:
 *         description: Location updated
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
 *       - name: busId
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Latest location retrieved
 */
router.get(
  "/bus/:busId/latest",
  authenticate,
  validateBusId,
  locationController.getLatestBusLocation
);

module.exports = router;
