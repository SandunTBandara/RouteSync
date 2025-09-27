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

    // Apply user-specific filtering for non-admin users
    if (user && user.assignedBusId) {
      filter._id = user.assignedBusId;
    }

    const buses = await Bus.find(filter)
      .populate("routeId", "routeNumber origin destination")
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
   * Get bus by MongoDB ID
   */
  async getBusById(busId, user = null) {
    let filter = { _id: busId };

    // Apply access control for regular users
    if (user && user.role !== "admin" && user.assignedBusId) {
      if (user.assignedBusId.toString() !== busId) {
        throw new Error(
          "Access denied. You can only access your assigned bus."
        );
      }
    }

    const bus = await Bus.findOne(filter).populate(
      "routeId",
      "routeNumber origin destination waypoints"
    );

    if (!bus) {
      throw new Error("Bus not found or access denied");
    }

    return bus;
  }

  /**
   * Get bus by unique busId (auto-generated identifier)
   */
  async getBusByBusId(busId, user = null) {
    let filter = { busId: busId };

    // Apply access control for regular users
    if (user && user.role !== "admin" && user.assignedBusId) {
      // For regular users, we need to find the bus first to check if it's their assigned bus
      const bus = await Bus.findOne({ busId: busId });
      if (!bus || bus._id.toString() !== user.assignedBusId.toString()) {
        throw new Error(
          "Access denied. You can only access your assigned bus."
        );
      }
    }

    const bus = await Bus.findOne(filter).populate(
      "routeId",
      "routeNumber origin destination waypoints"
    );

    if (!bus) {
      throw new Error("Bus not found or access denied");
    }

    return bus;
  }

  /**
   * Create a new bus
   */
  async createBus(busData, user = null) {
    const { busNumber, routeId, capacity, busType } = busData;

    // Authorization: Only admin can create buses
    if (user && user.role !== "admin") {
      throw new Error("Unauthorized access: Only admins can create buses");
    }

    // Check if bus number already exists
    const existingBus = await Bus.findOne({ busNumber });
    if (existingBus) {
      throw new Error("Bus with this number already exists");
    }

    // Validate route exists and is active
    const Route = require("../models/Route");
    const route = await Route.findById(routeId);
    if (!route || !route.isActive) {
      throw new Error("Invalid route: Route not found or inactive");
    }

    const bus = await Bus.create({
      busNumber,
      routeId,
      capacity,
      busType,
    });

    // Populate the created bus with route info
    await bus.populate([
      { path: "routeId", select: "routeNumber origin destination" },
    ]);

    logger.info(
      `New bus created: ${bus.busNumber} (User: ${user?.username || "System"})`
    );
    return bus;
  }

  /**
   * Update bus information
   */
  async updateBus(busId, updateData, user) {
    const { busNumber, capacity, busType, routeId, status } = updateData;

    let filter = { _id: busId };

    // Apply access control - only admin can update buses
    if (user.role !== "admin") {
      throw new Error("Only admins can update bus information");
    }

    // Check if busNumber is being updated and if it already exists
    if (busNumber) {
      const existingBus = await Bus.findOne({
        busNumber,
        _id: { $ne: busId },
      });
      if (existingBus) {
        throw new Error("Bus with this number already exists");
      }
    }

    // Build update object with only provided fields
    const updateFields = {};
    if (busNumber !== undefined) updateFields.busNumber = busNumber;
    if (capacity !== undefined) updateFields.capacity = capacity;
    if (busType !== undefined) updateFields.busType = busType;
    if (routeId !== undefined) updateFields.routeId = routeId;
    if (status !== undefined) updateFields.status = status;

    const bus = await Bus.findOneAndUpdate(filter, updateFields, {
      new: true,
      runValidators: true,
    }).populate("routeId", "routeNumber origin destination");

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

    // Apply access control - only assigned user or admin can update location
    if (user.role === "user") {
      if (!user.assignedBusId || user.assignedBusId.toString() !== busId) {
        throw new Error(
          "Access denied. You can only update your assigned bus location."
        );
      }
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
      user.role === "user" &&
      (!user.assignedBusId || user.assignedBusId.toString() !== busId)
    ) {
      throw new Error(
        "Access denied. You can only access your assigned bus location history."
      );
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
   * Get buses by route
   */
  async getBusesByRoute(routeId) {
    const buses = await Bus.find({ routeId, status: "active" }).sort({
      lastUpdated: -1,
    });

    return buses;
  }

  /**
   * Delete bus (Admin only)
   */
  async deleteBus(busId, user) {
    // Only admin can delete buses
    if (user.role !== "admin") {
      throw new Error("Only admins can delete buses");
    }

    const bus = await Bus.findById(busId);
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
    // Only admin can view bus statistics
    if (user.role !== "admin") {
      throw new Error("Only admins can view bus statistics");
    }

    const stats = await Bus.aggregate([
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 },
        },
      },
    ]);

    const totalBuses = await Bus.countDocuments();
    const activeBuses = await Bus.countDocuments({ status: "active" });
    const inactiveBuses = await Bus.countDocuments({ status: "inactive" });
    const maintenanceBuses = await Bus.countDocuments({
      status: "maintenance",
    });

    const busTypeStats = await Bus.aggregate([
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
