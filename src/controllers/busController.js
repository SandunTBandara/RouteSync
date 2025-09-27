const busService = require("../services/busService");
const logger = require("../utils/logger");

/**
 * @desc    Get all buses with current location
 * @route   GET /api/v1/buses
 * @access  Public
 */
const getAllBuses = async (req, res) => {
  try {
    const result = await busService.getAllBuses(req.query, req.user);

    res.status(200).json({
      success: true,
      count: result.buses.length,
      totalPages: result.pagination.totalPages,
      currentPage: result.pagination.currentPage,
      data: result.buses,
    });
  } catch (error) {
    logger.error("Error fetching buses:", error);

    if (error.message === "Unauthorized access") {
      return res.status(403).json({
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
 * @desc    Update bus location (GPS tracking endpoint)
 * @route   PUT /api/v1/buses/:id/location
 * @access  Private
 */
/**
 * @desc    Create a new bus
 * @route   POST /api/v1/buses
 * @access  Private (Admin/Operator)
 */
const createBus = async (req, res) => {
  try {
    const bus = await busService.createBus(req.body, req.user);

    res.status(201).json({
      success: true,
      message: "Bus created successfully",
      data: bus,
    });
  } catch (error) {
    logger.error("Error creating bus:", error);

    if (error.message === "Bus with this number already exists") {
      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }

    if (
      error.message === "Invalid operator" ||
      error.message === "Invalid route" ||
      error.message === "Unauthorized access"
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

const updateBusLocation = async (req, res) => {
  try {
    const { id } = req.params;
    const { latitude, longitude, timestamp, speed, heading } = req.body;

    // Validate coordinates
    if (!latitude || !longitude) {
      return res.status(400).json({
        success: false,
        message: "Latitude and longitude are required",
      });
    }

    const locationData = {
      latitude,
      longitude,
      timestamp,
      speed,
      heading,
    };

    const bus = await busService.updateBusLocation(id, locationData, req.user);

    res.status(200).json({
      success: true,
      data: bus,
    });
  } catch (error) {
    logger.error("Error updating bus location:", error);

    if (error.message === "Bus not found") {
      return res.status(404).json({
        success: false,
        message: error.message,
      });
    }

    if (
      error.message === "Unauthorized access" ||
      error.message.includes("not authorized to update")
    ) {
      return res.status(403).json({
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
 * @desc    Update bus information
 * @route   PUT /api/v1/buses/:id
 * @access  Private (Admin only)
 */
const updateBus = async (req, res) => {
  try {
    const { id } = req.params;
    const bus = await busService.updateBus(id, req.body, req.user);

    res.status(200).json({
      success: true,
      message: "Bus updated successfully",
      data: bus,
    });
  } catch (error) {
    logger.error("Error updating bus:", error);

    if (error.message === "Bus not found or access denied") {
      return res.status(404).json({
        success: false,
        message: error.message,
      });
    }

    if (error.message === "Only admins can update bus information") {
      return res.status(403).json({
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
 * @desc    Delete bus
 * @route   DELETE /api/v1/buses/:id
 * @access  Private (Admin only)
 */
const deleteBus = async (req, res) => {
  try {
    const { id } = req.params;
    await busService.deleteBus(id, req.user);

    res.status(200).json({
      success: true,
      message: "Bus deleted successfully",
    });
  } catch (error) {
    logger.error("Error deleting bus:", error);

    if (error.message === "Bus not found or access denied") {
      return res.status(404).json({
        success: false,
        message: error.message,
      });
    }

    if (error.message === "Only admins can delete buses") {
      return res.status(403).json({
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
  getAllBuses,
  createBus,
  updateBus,
  deleteBus,
  updateBusLocation,
};
