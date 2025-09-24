const Bus = require("../models/Bus");
const Location = require("../models/Location");
const logger = require("../utils/logger");

/**
 * @desc    Get all buses with current location
 * @route   GET /api/v1/buses
 * @access  Public
 */
const getAllBuses = async (req, res) => {
  try {
    const { page = 1, limit = 20, status, routeId } = req.query;

    const filter = {};
    if (status) filter.status = status;
    if (routeId) filter.routeId = routeId;

    const buses = await Bus.find(filter)
      .populate("routeId", "routeNumber origin destination")
      .populate("operatorId", "name contactInfo")
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .sort({ lastUpdated: -1 });

    const totalBuses = await Bus.countDocuments(filter);

    res.status(200).json({
      success: true,
      count: buses.length,
      totalPages: Math.ceil(totalBuses / limit),
      currentPage: page,
      data: buses,
    });
  } catch (error) {
    logger.error("Error fetching buses:", error);
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

    // Update bus current location
    const bus = await Bus.findByIdAndUpdate(
      id,
      {
        currentLocation: {
          type: "Point",
          coordinates: [longitude, latitude],
        },
        lastUpdated: new Date(),
      },
      { new: true, runValidators: true }
    );

    if (!bus) {
      return res.status(404).json({
        success: false,
        message: "Bus not found",
      });
    }

    // Store location history
    await Location.create({
      busId: id,
      location: {
        type: "Point",
        coordinates: [longitude, latitude],
      },
      timestamp: timestamp || new Date(),
      speed: speed || 0,
      heading: heading || 0,
    });

    res.status(200).json({
      success: true,
      data: bus,
    });
  } catch (error) {
    logger.error("Error updating bus location:", error);
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
