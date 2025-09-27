const userService = require("../services/userService");
const logger = require("../utils/logger");
const { validationResult } = require("express-validator");

/**
 * @desc    Get all users (Admin only)
 * @route   GET /api/v1/admin/users
 * @access  Private/Admin
 */
const getAllUsers = async (req, res) => {
  try {
    const result = await userService.getAllUsers(req.query);

    res.status(200).json({
      success: true,
      count: result.pagination.count,
      totalPages: result.pagination.totalPages,
      currentPage: result.pagination.currentPage,
      data: result.users,
    });
  } catch (error) {
    logger.error("Error fetching users:", error);
    res.status(500).json({
      success: false,
      message: "Server error fetching users",
    });
  }
};

/**
 * @desc    Get user by ID (Admin only)
 * @route   GET /api/v1/admin/users/:id
 * @access  Private/Admin
 */
const getUserById = async (req, res) => {
  try {
    const user = await userService.getUserById(req.params.id);

    res.status(200).json({
      success: true,
      data: user,
    });
  } catch (error) {
    logger.error("Error fetching user by ID:", error);

    if (error.message === "User not found") {
      return res.status(404).json({
        success: false,
        message: error.message,
      });
    }

    res.status(500).json({
      success: false,
      message: "Server error fetching user",
    });
  }
};

/**
 * @desc    Create admin user (Super Admin only)
 * @route   POST /api/v1/admin/create-admin
 * @access  Private/Admin
 */
const createAdmin = async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: errors.array(),
      });
    }

    // Force role to be admin
    const adminData = {
      ...req.body,
      role: "admin",
    };

    const admin = await userService.createUser(adminData);

    res.status(201).json({
      success: true,
      message: "Admin created successfully",
      data: {
        _id: admin._id,
        username: admin.username,
        email: admin.email,
        firstName: admin.firstName,
        lastName: admin.lastName,
        phone: admin.phone,
        role: admin.role,
        isActive: admin.isActive,
        createdAt: admin.createdAt,
      },
    });
  } catch (error) {
    logger.error("Error creating admin:", error);

    if (error.message === "User with this email or username already exists") {
      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }

    res.status(500).json({
      success: false,
      message: "Server error creating admin",
    });
  }
};

/**
 * @desc    Create user (Admin only)
 * @route   POST /api/v1/admin/users
 * @access  Private/Admin
 */
const createUser = async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: errors.array(),
      });
    }

    const user = await userService.createUser(req.body);

    res.status(201).json({
      success: true,
      message: "User created successfully",
      data: user,
    });
  } catch (error) {
    logger.error("Error creating user:", error);

    if (error.message === "User with this email or username already exists") {
      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }

    res.status(500).json({
      success: false,
      message: "Server error creating user",
    });
  }
};

/**
 * @desc    Update user (Admin only)
 * @route   PUT /api/v1/admin/users/:id
 * @access  Private/Admin
 */
const updateUser = async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: errors.array(),
      });
    }

    const updatedUser = await userService.updateUser(req.params.id, req.body);

    res.status(200).json({
      success: true,
      message: "User updated successfully",
      data: updatedUser,
    });
  } catch (error) {
    logger.error("Error updating user:", error);

    if (error.message === "User not found") {
      return res.status(404).json({
        success: false,
        message: error.message,
      });
    }

    res.status(500).json({
      success: false,
      message: "Server error updating user",
    });
  }
};

/**
 * @desc    Delete user (Admin only)
 * @route   DELETE /api/v1/admin/users/:id
 * @access  Private/Admin
 */
const deleteUser = async (req, res) => {
  try {
    await userService.deleteUser(req.params.id, req.user.id);

    res.status(200).json({
      success: true,
      message: "User deleted successfully",
    });
  } catch (error) {
    logger.error("Error deleting user:", error);

    if (error.message === "User not found") {
      return res.status(404).json({
        success: false,
        message: error.message,
      });
    }

    if (error.message === "You cannot delete your own account") {
      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }

    res.status(500).json({
      success: false,
      message: "Server error deleting user",
    });
  }
};

/**
 * @desc    Get user statistics (Admin only)
 * @route   GET /api/v1/admin/users/stats
 * @access  Private/Admin
 */
const getUserStats = async (req, res) => {
  try {
    const stats = await userService.getUserStats();

    res.status(200).json({
      success: true,
      data: stats,
    });
  } catch (error) {
    logger.error("Error fetching user stats:", error);
    res.status(500).json({
      success: false,
      message: "Server error fetching user statistics",
    });
  }
};

module.exports = {
  getAllUsers,
  getUserById,
  createAdmin,
  createUser,
  updateUser,
  deleteUser,
  getUserStats,
};
