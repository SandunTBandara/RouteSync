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

module.exports = {
  getAllBuses,
  updateBusLocation,
};
