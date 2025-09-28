const routeService = require("../services/routeService");
const logger = require("../utils/logger");
const { validationResult } = require("express-validator");

/**
 * @desc    Get all routes
 * @route   GET /api/v1/routes
 * @access  Public
 */
const getAllRoutes = async (req, res) => {
  try {
    const result = await routeService.getAllRoutes(req.query);

    res.status(200).json({
      success: true,
      count: result.routes.length,
      totalPages: result.pagination.totalPages,
      currentPage: result.pagination.currentPage,
      data: result.routes,
    });
  } catch (error) {
    logger.error("Error fetching routes:", error);
    res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
};

/**
 * @desc    Get single route
 * @route   GET /api/v1/routes/:id
 * @access  Public
 */
const getRoute = async (req, res) => {
  try {
    const route = await routeService.getRouteById(req.params.id);

    res.status(200).json({
      success: true,
      data: route,
    });
  } catch (error) {
    logger.error("Error fetching route:", error);

    if (error.message === "Route not found") {
      return res.status(404).json({
        success: false,
        message: error.message,
      });
    }

    res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
};

/**
 * @desc    Create new route
 * @route   POST /api/v1/routes
 * @access  Private (Admin only)
 */
const createRoute = async (req, res) => {
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

    const route = await routeService.createRoute(req.body);

    res.status(201).json({
      success: true,
      message: "Route created successfully",
      data: route,
    });
  } catch (error) {
    logger.error("Error creating route:", error);

    if (error.message === "Route with this number already exists") {
      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }

    if (error.message.includes("Invalid waypoint structure")) {
      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }

    res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
};

/**
 * @desc    Update route
 * @route   PUT /api/v1/routes/:id
 * @access  Private (Admin only)
 */
const updateRoute = async (req, res) => {
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

    const route = await routeService.updateRoute(req.params.id, req.body);

    res.status(200).json({
      success: true,
      message: "Route updated successfully",
      data: route,
    });
  } catch (error) {
    logger.error("Error updating route:", error);

    if (error.message === "Route not found") {
      return res.status(404).json({
        success: false,
        message: error.message,
      });
    }

    if (
      error.message === "Route number already exists" ||
      error.message.includes("Invalid waypoint structure")
    ) {
      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }

    res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
};

/**
 * @desc    Delete route
 * @route   DELETE /api/v1/routes/:id
 * @access  Private (Admin only)
 */
const deleteRoute = async (req, res) => {
  try {
    await routeService.deleteRoute(req.params.id);

    res.status(200).json({
      success: true,
      message: "Route deleted successfully",
    });
  } catch (error) {
    logger.error("Error deleting route:", error);

    if (error.message === "Route not found") {
      return res.status(404).json({
        success: false,
        message: error.message,
      });
    }

    if (error.message === "Cannot delete route with active buses") {
      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }

    res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
};

/**
 * @desc    Search routes
 * @route   GET /api/v1/routes/search
 * @access  Public
 */
const searchRoutes = async (req, res) => {
  try {
    const routes = await routeService.searchRoutes(req.query);

    res.status(200).json({
      success: true,
      count: routes.length,
      data: routes,
    });
  } catch (error) {
    logger.error("Error searching routes:", error);
    res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
};

/**
 * @desc    Get route statistics
 * @route   GET /api/v1/routes/stats
 * @access  Private (Admin only)
 */
const getRouteStats = async (req, res) => {
  try {
    const stats = await routeService.getRouteStats();

    res.status(200).json({
      success: true,
      data: stats,
    });
  } catch (error) {
    logger.error("Error fetching route stats:", error);
    res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
};

/**
 * @desc    Get buses on route
 * @route   GET /api/v1/routes/:id/buses
 * @access  Public
 */
const getBusesOnRoute = async (req, res) => {
  try {
    const buses = await routeService.getBusesOnRoute(req.params.id);

    res.status(200).json({
      success: true,
      count: buses.length,
      data: buses,
    });
  } catch (error) {
    logger.error("Error fetching buses on route:", error);

    if (error.message === "Route not found") {
      return res.status(404).json({
        success: false,
        message: error.message,
      });
    }

    res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
};

/**
 * @desc    Toggle route status (active/inactive)
 * @route   PATCH /api/v1/routes/:id/toggle-status
 * @access  Private (Admin only)
 */
const toggleRouteStatus = async (req, res) => {
  try {
    const route = await routeService.toggleRouteStatus(req.params.id);

    res.status(200).json({
      success: true,
      message: `Route status updated to ${
        route.isActive ? "active" : "inactive"
      }`,
      data: route,
    });
  } catch (error) {
    logger.error("Error toggling route status:", error);

    if (error.message === "Route not found") {
      return res.status(404).json({
        success: false,
        message: error.message,
      });
    }

    res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
};

module.exports = {
  getAllRoutes,
  getRoute,
  createRoute,
  updateRoute,
  deleteRoute,
  searchRoutes,
  getRouteStats,
  getBusesOnRoute,
  toggleRouteStatus,
};
