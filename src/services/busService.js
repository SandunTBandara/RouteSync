const Bus = require("../models/Bus");
const Location = require("../models/Location");
const logger = require("../utils/logger");

class BusService {
  /**
   * Get all buses with pagination and filtering
   */
  async getAllBuses(filters, user = null) {
    const { page = 1, limit = 20, status, routeId } = filters;

    const filter = {};
    if (status) filter.status = status;
    if (routeId) filter.routeId = routeId;

    // Apply operator-specific filtering for non-admin users
    if (user) {
      if (user.role === "operator") {
        filter.operatorId = user.operatorId;
      } else if (user.role === "driver" && user.assignedBusId) {
        filter._id = user.assignedBusId;
      }
    }

    const buses = await Bus.find(filter)
      .populate("routeId", "routeNumber origin destination")
      .populate("operatorId", "name contactInfo")
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .sort({ lastUpdated: -1 });

    const totalBuses = await Bus.countDocuments(filter);

    return {
      buses,
      pagination: {
        totalBuses,
        totalPages: Math.ceil(totalBuses / limit),
        currentPage: page,
        count: buses.length,
      },
    };
  }

  /**
   * Get bus by ID
   */
  async getBusById(busId, user = null) {
    let filter = { _id: busId };

    // Apply access control
    if (user) {
      if (user.role === "operator") {
        filter.operatorId = user.operatorId;
      } else if (user.role === "driver" && user.assignedBusId) {
        if (user.assignedBusId.toString() !== busId) {
          throw new Error(
            "Access denied. You can only access your assigned bus."
          );
        }
      }
    }

    const bus = await Bus.findOne(filter)
      .populate("routeId", "routeNumber origin destination waypoints")
      .populate("operatorId", "name registrationNumber contactInfo");

    if (!bus) {
      throw new Error("Bus not found or access denied");
    }

    return bus;
  }

  /**
   * Create a new bus
   */
  async createBus(busData) {
    const {
      busNumber,
      operatorId,
      routeId,
      capacity,
      busType,
      currentLocation,
    } = busData;

    // Check if bus number already exists
    const existingBus = await Bus.findOne({ busNumber });
    if (existingBus) {
      throw new Error("Bus with this number already exists");
    }

    const bus = await Bus.create({
      busNumber,
      operatorId,
      routeId,
      capacity,
      busType,
      currentLocation,
    });

    logger.info(`New bus created: ${bus.busNumber} by operator: ${operatorId}`);
    return bus;
  }

  /**
   * Update bus information
   */
  async updateBus(busId, updateData, user) {
    const { capacity, busType, routeId, status } = updateData;

    let filter = { _id: busId };

    // Apply access control
    if (user.role === "operator") {
      filter.operatorId = user.operatorId;
    } else if (user.role === "driver") {
      throw new Error("Drivers cannot update bus information");
    }

    const bus = await Bus.findOneAndUpdate(
      filter,
      { capacity, busType, routeId, status },
      { new: true, runValidators: true }
    ).populate("routeId", "routeNumber origin destination");

    if (!bus) {
      throw new Error("Bus not found or access denied");
    }

    logger.info(`Bus updated: ${bus.busNumber}`);
    return bus;
  }

  /**
   * Update bus location (GPS tracking)
   */
  async updateBusLocation(busId, locationData, user) {
    const {
      latitude,
      longitude,
      timestamp,
      speed = 0,
      heading = 0,
      accuracy = 0,
    } = locationData;

    // Validate coordinates
    if (!latitude || !longitude) {
      throw new Error("Latitude and longitude are required");
    }

    if (latitude < -90 || latitude > 90) {
      throw new Error("Latitude must be between -90 and 90");
    }

    if (longitude < -180 || longitude > 180) {
      throw new Error("Longitude must be between -180 and 180");
    }

    let filter = { _id: busId };

    // Apply access control - only assigned driver or operator can update location
    if (user.role === "driver") {
      if (!user.assignedBusId || user.assignedBusId.toString() !== busId) {
        throw new Error(
          "Access denied. You can only update your assigned bus location."
        );
      }
    } else if (user.role === "operator") {
      filter.operatorId = user.operatorId;
    }

    // Update bus current location
    const bus = await Bus.findOneAndUpdate(
      filter,
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
      throw new Error("Bus not found or access denied");
    }

    // Store location history
    const locationHistory = await Location.create({
      busId: busId,
      location: {
        type: "Point",
        coordinates: [longitude, latitude],
      },
      timestamp: timestamp ? new Date(timestamp) : new Date(),
      speed,
      heading,
      accuracy,
    });

    logger.info(
      `Location updated for bus: ${bus.busNumber} by user: ${user.username}`
    );

    return {
      bus,
      locationHistory,
    };
  }

  /**
   * Get bus location history
   */
  async getBusLocationHistory(busId, filters, user) {
    const { limit = 50, startDate, endDate } = filters;

    // Check access permissions
    if (
      user.role === "driver" &&
      (!user.assignedBusId || user.assignedBusId.toString() !== busId)
    ) {
      throw new Error(
        "Access denied. You can only access your assigned bus location history."
      );
    }

    if (user.role === "operator") {
      const bus = await Bus.findOne({
        _id: busId,
        operatorId: user.operatorId,
      });
      if (!bus) {
        throw new Error("Access denied. Bus not found in your operator fleet.");
      }
    }

    const filter = { busId };

    if (startDate || endDate) {
      filter.timestamp = {};
      if (startDate) filter.timestamp.$gte = new Date(startDate);
      if (endDate) filter.timestamp.$lte = new Date(endDate);
    }

    const locations = await Location.find(filter)
      .sort({ timestamp: -1 })
      .limit(limit * 1);

    return locations;
  }

  /**
   * Get buses by operator
   */
  async getBusesByOperator(operatorId, user) {
    // Check access permissions
    if (user.role === "operator" && user.operatorId.toString() !== operatorId) {
      throw new Error(
        "Access denied. You can only access buses from your operator."
      );
    }

    const buses = await Bus.find({ operatorId, isActive: true })
      .populate("routeId", "routeNumber origin destination")
      .sort({ busNumber: 1 });

    return buses;
  }

  /**
   * Get buses by route
   */
  async getBusesByRoute(routeId) {
    const buses = await Bus.find({ routeId, status: "active" })
      .populate("operatorId", "name contactInfo")
      .sort({ lastUpdated: -1 });

    return buses;
  }

  /**
   * Delete bus (Admin/Operator only)
   */
  async deleteBus(busId, user) {
    let filter = { _id: busId };

    // Apply access control
    if (user.role === "operator") {
      filter.operatorId = user.operatorId;
    }

    const bus = await Bus.findOne(filter);
    if (!bus) {
      throw new Error("Bus not found or access denied");
    }

    // Also delete associated location history
    await Location.deleteMany({ busId });

    await Bus.findByIdAndDelete(busId);

    logger.info(`Bus deleted: ${bus.busNumber} by user: ${user.username}`);
    return true;
  }

  /**
   * Get bus statistics
   */
  async getBusStats(user) {
    let matchFilter = {};

    // Apply role-based filtering
    if (user.role === "operator") {
      matchFilter.operatorId = user.operatorId;
    }

    const stats = await Bus.aggregate([
      { $match: matchFilter },
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 },
        },
      },
    ]);

    const totalBuses = await Bus.countDocuments(matchFilter);
    const activeBuses = await Bus.countDocuments({
      ...matchFilter,
      status: "active",
    });
    const inactiveBuses = await Bus.countDocuments({
      ...matchFilter,
      status: "inactive",
    });
    const maintenanceBuses = await Bus.countDocuments({
      ...matchFilter,
      status: "maintenance",
    });

    const busTypeStats = await Bus.aggregate([
      { $match: matchFilter },
      {
        $group: {
          _id: "$busType",
          count: { $sum: 1 },
        },
      },
    ]);

    return {
      totalBuses,
      activeBuses,
      inactiveBuses,
      maintenanceBuses,
      statusStats: stats,
      busTypeStats,
    };
  }

  /**
   * Get nearby buses within radius
   */
  async getNearbyBuses(latitude, longitude, radiusInKm = 10) {
    const buses = await Bus.find({
      currentLocation: {
        $near: {
          $geometry: {
            type: "Point",
            coordinates: [longitude, latitude],
          },
          $maxDistance: radiusInKm * 1000, // Convert km to meters
        },
      },
      status: "active",
    })
      .populate("routeId", "routeNumber origin destination")
      .populate("operatorId", "name")
      .limit(20);

    return buses;
  }
}

module.exports = new BusService();
