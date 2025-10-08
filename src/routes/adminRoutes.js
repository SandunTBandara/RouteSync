const express = require("express");
const {
  getAllUsers,
  getUserById,
  createAdmin,
  createUser,
  updateUser,
  deleteUser,
  getUserStats,
  createBusOperator,
  getAllBusOperators,
  getBusOperatorById,
  updateBusOperator,
  deleteBusOperator,
} = require("../controllers/adminController");
const { protect, authorize } = require("../middleware/auth");
const { validateRegister } = require("../middleware/validation");

const router = express.Router();

// Apply admin authorization to all routes
router.use(protect);
router.use(authorize("admin"));

/**
 * @swagger
 * /admin/users/stats:
 *   get:
 *     summary: Get user statistics (Admin only)
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User statistics retrieved successfully
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
 *                     totalUsers:
 *                       type: number
 *                     activeUsers:
 *                       type: number
 *                     inactiveUsers:
 *                       type: number
 *                     roleStats:
 *                       type: array
 *                       items:
 *                         type: object
 *       403:
 *         description: Access denied - Admin role required
 *       500:
 *         description: Server error
 */
router.get("/users/stats", getUserStats);

/**
 * @swagger
 * /admin/users:
 *   get:
 *     summary: Get all users (Admin only)
 *     tags: [Admin]
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
 *         description: Number of users per page
 *       - in: query
 *         name: role
 *         schema:
 *           type: string
 *           enum: [admin, user]
 *         description: Filter by role
 *       - in: query
 *         name: isActive
 *         schema:
 *           type: boolean
 *         description: Filter by active status
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search in username, email, firstName, lastName
 *     responses:
 *       200:
 *         description: Users retrieved successfully
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
 *                     $ref: '#/components/schemas/User'
 */
router.get("/users", getAllUsers);

/**
 * @swagger
 * /admin/create-admin:
 *   post:
 *     summary: Create a new admin user (Admin only)
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - username
 *               - email
 *               - password
 *               - firstName
 *               - lastName
 *               - phone
 *             properties:
 *               username:
 *                 type: string
 *                 description: Unique username for the admin
 *                 example: "admin_john"
 *               email:
 *                 type: string
 *                 format: email
 *                 description: Admin email address
 *                 example: "john.admin@company.com"
 *               password:
 *                 type: string
 *                 minLength: 6
 *                 description: Strong password for the admin
 *                 example: "AdminPass123"
 *               firstName:
 *                 type: string
 *                 description: Admin first name
 *                 example: "John"
 *               lastName:
 *                 type: string
 *                 description: Admin last name
 *                 example: "Doe"
 *               phone:
 *                 type: string
 *                 description: Admin phone number
 *                 example: "+94771234567"
 *     responses:
 *       201:
 *         description: Admin created successfully
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
 *                   example: "Admin created successfully"
 *                 data:
 *                   type: object
 *                   properties:
 *                     _id:
 *                       type: string
 *                     username:
 *                       type: string
 *                     email:
 *                       type: string
 *                     firstName:
 *                       type: string
 *                     lastName:
 *                       type: string
 *                     phone:
 *                       type: string
 *                     role:
 *                       type: string
 *                       example: "admin"
 *                     isActive:
 *                       type: boolean
 *                     createdAt:
 *                       type: string
 *                       format: date-time
 *       400:
 *         description: Validation error or user already exists
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
 *                   example: "User with this email or username already exists"
 *       403:
 *         description: Access denied - Admin role required
 *       500:
 *         description: Server error
 */
router.post("/create-admin", validateRegister, createAdmin);

/**
 * @swagger
 * /admin/users:
 *   post:
 *     summary: Create new user (Admin only)
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/RegisterRequest'
 *     responses:
 *       201:
 *         description: User created successfully
 *       400:
 *         description: Validation error or user already exists
 *       403:
 *         description: Access denied - Admin role required
 *       500:
 *         description: Server error
 */
router.post("/users", validateRegister, createUser);

/**
 * @swagger
 * /admin/users/{id}:
 *   get:
 *     summary: Get user by ID (Admin only)
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: User ID
 *     responses:
 *       200:
 *         description: User retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/User'
 *       404:
 *         description: User not found
 *       403:
 *         description: Access denied - Admin role required
 */
router.get("/users/:id", getUserById);

/**
 * @swagger
 * /admin/users/{id}:
 *   put:
 *     summary: Update user (Admin only)
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: User ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               firstName:
 *                 type: string
 *               lastName:
 *                 type: string
 *               phone:
 *                 type: string
 *               role:
 *                 type: string
 *                 enum: [admin, user, bus_operator]
 *               isActive:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: User updated successfully
 *       400:
 *         description: Validation error
 *       404:
 *         description: User not found
 *       403:
 *         description: Access denied - Admin role required
 */
router.put("/users/:id", updateUser);

/**
 * @swagger
 * /admin/users/{id}:
 *   delete:
 *     summary: Delete user (Admin only)
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: User ID
 *     responses:
 *       200:
 *         description: User deleted successfully
 *       400:
 *         description: Cannot delete own account
 *       404:
 *         description: User not found
 *       403:
 *         description: Access denied - Admin role required
 */
router.delete("/users/:id", deleteUser);

// Bus Operator Management Routes

/**
 * @swagger
 * /admin/bus-operators:
 *   post:
 *     summary: Create bus operator (Admin only)
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - username
 *               - email
 *               - password
 *               - firstName
 *               - lastName
 *               - phone
 *             properties:
 *               username:
 *                 type: string
 *                 minLength: 3
 *                 maxLength: 30
 *               email:
 *                 type: string
 *                 format: email
 *               password:
 *                 type: string
 *                 minLength: 6
 *               firstName:
 *                 type: string
 *                 maxLength: 50
 *               lastName:
 *                 type: string
 *                 maxLength: 50
 *               phone:
 *                 type: string
 *                 example: "+94771234567"
 *     responses:
 *       201:
 *         description: Bus operator created successfully
 *       400:
 *         description: Validation error or user already exists
 *       403:
 *         description: Access denied - Admin role required
 */
router.post("/bus-operators", validateRegister, createBusOperator);

/**
 * @swagger
 * /admin/bus-operators:
 *   get:
 *     summary: Get all bus operators (Admin only)
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *         description: Number of items per page
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search by username, email, firstName, or lastName
 *       - in: query
 *         name: isActive
 *         schema:
 *           type: boolean
 *         description: Filter by active status
 *     responses:
 *       200:
 *         description: Bus operators retrieved successfully
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
 *                     $ref: '#/components/schemas/User'
 *       403:
 *         description: Access denied - Admin role required
 */
router.get("/bus-operators", getAllBusOperators);

/**
 * @swagger
 * /admin/bus-operators/{id}:
 *   get:
 *     summary: Get bus operator by ID (Admin only)
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Bus operator ID
 *     responses:
 *       200:
 *         description: Bus operator retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/User'
 *       400:
 *         description: User is not a bus operator
 *       404:
 *         description: Bus operator not found
 *       403:
 *         description: Access denied - Admin role required
 */
router.get("/bus-operators/:id", getBusOperatorById);

/**
 * @swagger
 * /admin/bus-operators/{id}:
 *   put:
 *     summary: Update bus operator (Admin only)
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Bus operator ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               username:
 *                 type: string
 *                 minLength: 3
 *                 maxLength: 30
 *               email:
 *                 type: string
 *                 format: email
 *               firstName:
 *                 type: string
 *                 maxLength: 50
 *               lastName:
 *                 type: string
 *                 maxLength: 50
 *               phone:
 *                 type: string
 *                 description: Admin phone number
 *                 example: "+94771234567"
 *               isActive:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Bus operator updated successfully
 *       400:
 *         description: Validation error or email/username already exists
 *       404:
 *         description: Bus operator not found
 *       403:
 *         description: Access denied - Admin role required
 */
router.put("/bus-operators/:id", updateBusOperator);

/**
 * @swagger
 * /admin/bus-operators/{id}:
 *   delete:
 *     summary: Delete bus operator (Admin only)
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Bus operator ID
 *     responses:
 *       200:
 *         description: Bus operator deleted successfully
 *       400:
 *         description: User is not a bus operator
 *       404:
 *         description: Bus operator not found
 *       403:
 *         description: Access denied - Admin role required
 */
router.delete("/bus-operators/:id", deleteBusOperator);

module.exports = router;
