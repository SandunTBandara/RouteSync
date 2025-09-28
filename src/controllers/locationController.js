const locationService = require("../services/locationService");
const { validationResult } = require("express-validator");

/**
 * Get location tracking details for a particular bus on a specific date
 * GET /api/locations/bus/:busId/date/:date
 */
const getLocationsByBusAndDate = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: errors.array(),
      });
    }

    const { busId, date } = req.params;

    // Parse date and create date range for the specified date
    const startDate = new Date(date);
    const endDate = new Date(date);
    endDate.setDate(endDate.getDate() + 1);

    // Validate date
    if (isNaN(startDate.getTime())) {
      return res.status(400).json({
        success: false,
        message: "Invalid date format. Use YYYY-MM-DD",
      });
    }

    // Use the existing service method but filter by date
    const locationHistory = await locationService.getBusLocationHistory(
      busId,
      {
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        limit: 1000, // Get all locations for the day
      },
      req.user
    );

    res.json({
      success: true,
      message: `Location tracking details for bus ${busId} on ${date}`,
      data: {
        busId,
        date,
        totalRecords: locationHistory.locations.length,
        locations: locationHistory.locations,
      },
    });
  } catch (error) {
    console.error("Error getting locations by bus and date:", error);
    res.status(error.message.includes("not found") ? 404 : 500).json({
      success: false,
      message: error.message || "Failed to get location tracking details",
    });
  }
};

/**
 * Update bus location with timestamp, longitude, latitude, and speed
 * POST/PUT /api/locations/bus/:busId/update
 */
const updateBusLocation = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: errors.array(),
      });
    }

    const { busId } = req.params;
    const { longitude, latitude, speed, heading, timestamp } = req.body;

    // Prepare location data
    const locationData = {
      longitude,
      latitude,
      speed: speed || 0,
      heading: heading || 0,
      timestamp: timestamp || new Date().toISOString(),
    };

    // Use the existing service method
    const updatedLocation = await locationService.updateBusLocation(
      busId,
      locationData,
      req.user
    );

    res.status(201).json({
      success: true,
      message: "Bus location updated successfully",
      data: {
        busId,
        location: updatedLocation,
        timestamp: updatedLocation.timestamp,
        coordinates: {
          longitude: updatedLocation.location.coordinates[0],
          latitude: updatedLocation.location.coordinates[1],
        },
        speed: updatedLocation.speed,
        heading: updatedLocation.heading,
      },
    });
  } catch (error) {
    console.error("Error updating bus location:", error);
    res.status(error.message.includes("not found") ? 404 : 500).json({
      success: false,
      message: error.message || "Failed to update bus location",
    });
  }
};

/**
 * Get latest location for a specific bus
 * GET /api/locations/bus/:busId/latest
 */
const getLatestBusLocation = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: errors.array(),
      });
    }

    const { busId } = req.params;

    const latestLocation = await locationService.getBusLocation(
      busId,
      req.user
    );

    res.json({
      success: true,
      message: "Latest bus location retrieved successfully",
      data: {
        busId,
        location: latestLocation,
        coordinates: {
          longitude: latestLocation.location.coordinates[0],
          latitude: latestLocation.location.coordinates[1],
        },
        speed: latestLocation.speed,
        heading: latestLocation.heading,
        timestamp: latestLocation.timestamp,
        lastUpdated: latestLocation.updatedAt,
      },
    });
  } catch (error) {
    console.error("Error getting latest bus location:", error);
    res.status(error.message.includes("not found") ? 404 : 500).json({
      success: false,
      message: error.message || "Failed to get latest bus location",
    });
  }
};

/**
 * Get location history for a bus with pagination
 * GET /api/locations/bus/:busId/history
 */
const getBusLocationHistory = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: errors.array(),
      });
    }

    const { busId } = req.params;
    const { limit = 50, page = 1, startDate, endDate } = req.query;

    const filters = {
      limit: parseInt(limit),
      page: parseInt(page),
    };

    if (startDate) filters.startDate = startDate;
    if (endDate) filters.endDate = endDate;

    const locationHistory = await locationService.getBusLocationHistory(
      busId,
      filters,
      req.user
    );

    res.json({
      success: true,
      message: "Bus location history retrieved successfully",
      data: {
        busId,
        ...locationHistory,
      },
    });
  } catch (error) {
    console.error("Error getting bus location history:", error);
    res.status(error.message.includes("not found") ? 404 : 500).json({
      success: false,
      message: error.message || "Failed to get bus location history",
    });
  }
};

/**
 * Get all active bus locations
 * GET /api/locations/buses/active
 */
const getAllActiveBusLocations = async (req, res) => {
  try {
    const { limit = 100 } = req.query;

    const filters = {
      limit: parseInt(limit),
      activeOnly: true,
    };

    const locations = await locationService.getAllBusLocations(filters);

    res.json({
      success: true,
      message: "Active bus locations retrieved successfully",
      data: {
        totalBuses: locations.length,
        locations,
      },
    });
  } catch (error) {
    console.error("Error getting all active bus locations:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to get active bus locations",
    });
  }
};

/**
 * Get buses near a specific location
 * GET /api/locations/nearby
 */
const getBusesNearLocation = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: errors.array(),
      });
    }

    const { latitude, longitude, radius = 5 } = req.query;

    const nearbyBuses = await locationService.getBusesNearLocation(
      parseFloat(latitude),
      parseFloat(longitude),
      parseFloat(radius)
    );

    res.json({
      success: true,
      message: `Buses within ${radius}km radius retrieved successfully`,
      data: {
        searchLocation: {
          latitude: parseFloat(latitude),
          longitude: parseFloat(longitude),
        },
        radius: parseFloat(radius),
        totalBuses: nearbyBuses.length,
        buses: nearbyBuses,
      },
    });
  } catch (error) {
    console.error("Error getting nearby buses:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to get nearby buses",
    });
  }
};

/**
 * Get location statistics for a bus
 * GET /api/locations/bus/:busId/stats
 */
const getBusLocationStats = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: errors.array(),
      });
    }

    const { busId } = req.params;

    const stats = await locationService.getBusLocationStats(busId, req.user);

    res.json({
      success: true,
      message: "Bus location statistics retrieved successfully",
      data: {
        busId,
        ...stats,
      },
    });
  } catch (error) {
    console.error("Error getting bus location stats:", error);
    res.status(error.message.includes("not found") ? 404 : 500).json({
      success: false,
      message: error.message || "Failed to get bus location statistics",
    });
  }
};

module.exports = {
  getLocationsByBusAndDate,
  updateBusLocation,
  getLatestBusLocation,
  getBusLocationHistory,
  getAllActiveBusLocations,
  getBusesNearLocation,
  getBusLocationStats,
};
