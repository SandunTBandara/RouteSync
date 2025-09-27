const Location = require("../models/Location");
const Bus = require("../models/Bus");
const logger = require("../utils/logger");

class LocationService {
  /**
   * Get all current bus locations
   */
  async getAllBusLocations(filters = {}) {
    const { limit = 100, activeOnly = true } = filters;

    const matchFilter = {};
    if (activeOnly) {
      // Get only locations of active buses
      const activeBuses = await Bus.find({ status: "active" }).select("_id");
      const activeBusIds = activeBuses.map((bus) => bus._id);
      matchFilter.busId = { $in: activeBusIds };
    }

    // Get the latest location for each bus
    const locations = await Location.aggregate([
      { $match: matchFilter },
      {
        $sort: { busId: 1, timestamp: -1 },
      },
      {
        $group: {
          _id: "$busId",
          latestLocation: { $first: "$$ROOT" },
        },
      },
      {
        $replaceRoot: { newRoot: "$latestLocation" },
      },
      {
        $lookup: {
          from: "buses",
          localField: "busId",
          foreignField: "_id",
          as: "bus",
        },
      },
      {
        $unwind: "$bus",
      },
      {
        $lookup: {
          from: "routes",
          localField: "bus.routeId",
          foreignField: "_id",
          as: "route",
        },
      },
      {
        $unwind: { path: "$route", preserveNullAndEmptyArrays: true },
      },
      {
        $lookup: {
          from: "operators",
          localField: "bus.operatorId",
          foreignField: "_id",
          as: "operator",
        },
      },
      {
        $unwind: { path: "$operator", preserveNullAndEmptyArrays: true },
      },
      {
        $project: {
          busId: 1,
          location: 1,
          speed: 1,
          heading: 1,
          timestamp: 1,
          accuracy: 1,
          "bus.busNumber": 1,
          "bus.busType": 1,
          "bus.status": 1,
          "route.routeNumber": 1,
          "route.origin": 1,
          "route.destination": 1,
        },
      },
      { $limit: limit },
    ]);

    return locations;
  }

  /**
   * Get location for a specific bus
   */
  async getBusLocation(busId, user = null) {
    // Check access permissions
    if (user) {
      if (
        user.role === "driver" &&
        (!user.assignedBusId || user.assignedBusId.toString() !== busId)
      ) {
        throw new Error(
          "Access denied. You can only access your assigned bus location."
        );
      }
    }

    const location = await Location.findOne({ busId })
      .sort({ timestamp: -1 })
      .populate({
        path: "busId",
        select: "busNumber busType status",
        populate: [
          {
            path: "routeId",
            select: "routeNumber origin destination",
          },
        ],
      });

    if (!location) {
      throw new Error("Location not found for this bus");
    }

    return location;
  }

  /**
   * Update bus location
   */
  async updateBusLocation(busId, locationData, user) {
    const {
      latitude,
      longitude,
      speed = 0,
      heading = 0,
      accuracy = 0,
      timestamp,
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

    // Check access permissions
    if (user.role === "driver") {
      if (!user.assignedBusId || user.assignedBusId.toString() !== busId) {
        throw new Error(
          "Access denied. You can only update your assigned bus location."
        );
      }
    }

    // Create location record
    const location = await Location.create({
      busId,
      location: {
        type: "Point",
        coordinates: [longitude, latitude],
      },
      speed,
      heading,
      accuracy,
      timestamp: timestamp ? new Date(timestamp) : new Date(),
    });

    // Update bus current location
    await Bus.findByIdAndUpdate(busId, {
      currentLocation: {
        type: "Point",
        coordinates: [longitude, latitude],
      },
      lastUpdated: new Date(),
    });

    logger.info(`Location updated for bus: ${busId} by user: ${user.username}`);
    return location;
  }

  /**
   * Get location history for a bus
   */
  async getBusLocationHistory(busId, filters = {}, user = null) {
    const { limit = 50, startDate, endDate, page = 1 } = filters;

    // Check access permissions
    if (user) {
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
          throw new Error(
            "Access denied. Bus not found in your operator fleet."
          );
        }
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
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const totalLocations = await Location.countDocuments(filter);

    return {
      locations,
      pagination: {
        totalLocations,
        totalPages: Math.ceil(totalLocations / limit),
        currentPage: page,
        count: locations.length,
      },
    };
  }

  /**
   * Get buses within a radius of a point
   */
  async getBusesNearLocation(latitude, longitude, radiusInKm = 5) {
    if (latitude < -90 || latitude > 90) {
      throw new Error("Latitude must be between -90 and 90");
    }

    if (longitude < -180 || longitude > 180) {
      throw new Error("Longitude must be between -180 and 180");
    }

    const radiusInMeters = radiusInKm * 1000;

    const nearbyBuses = await Location.aggregate([
      {
        $geoNear: {
          near: {
            type: "Point",
            coordinates: [longitude, latitude],
          },
          distanceField: "distance",
          maxDistance: radiusInMeters,
        },
      },
      {
        $sort: { busId: 1, timestamp: -1 },
      },
      {
        $group: {
          _id: "$busId",
          latestLocation: { $first: "$$ROOT" },
        },
      },
      {
        $replaceRoot: { newRoot: "$latestLocation" },
      },
      {
        $lookup: {
          from: "buses",
          localField: "busId",
          foreignField: "_id",
          as: "bus",
        },
      },
      {
        $unwind: "$bus",
      },
      {
        $match: {
          "bus.status": "active",
        },
      },
      {
        $lookup: {
          from: "routes",
          localField: "bus.routeId",
          foreignField: "_id",
          as: "route",
        },
      },
      {
        $unwind: { path: "$route", preserveNullAndEmptyArrays: true },
      },
      {
        $lookup: {
          from: "operators",
          localField: "bus.operatorId",
          foreignField: "_id",
          as: "operator",
        },
      },
      {
        $unwind: { path: "$operator", preserveNullAndEmptyArrays: true },
      },
      {
        $project: {
          busId: 1,
          location: 1,
          speed: 1,
          heading: 1,
          timestamp: 1,
          distance: { $round: [{ $divide: ["$distance", 1000] }, 2] }, // Convert to km and round
          "bus.busNumber": 1,
          "bus.busType": 1,
          "route.routeNumber": 1,
          "route.origin": 1,
          "route.destination": 1,
          "operator.name": 1,
        },
      },
      {
        $sort: { distance: 1 },
      },
    ]);

    return nearbyBuses;
  }

  /**
   * Get location statistics for a bus
   */
  async getBusLocationStats(busId, user = null) {
    // Check access permissions
    if (user) {
      if (
        user.role === "driver" &&
        (!user.assignedBusId || user.assignedBusId.toString() !== busId)
      ) {
        throw new Error(
          "Access denied. You can only access your assigned bus statistics."
        );
      }

      if (user.role === "operator") {
        const bus = await Bus.findOne({
          _id: busId,
          operatorId: user.operatorId,
        });
        if (!bus) {
          throw new Error(
            "Access denied. Bus not found in your operator fleet."
          );
        }
      }
    }

    const stats = await Location.aggregate([
      { $match: { busId: require("mongoose").Types.ObjectId(busId) } },
      {
        $group: {
          _id: null,
          totalRecords: { $sum: 1 },
          avgSpeed: { $avg: "$speed" },
          maxSpeed: { $max: "$speed" },
          firstRecord: { $min: "$timestamp" },
          lastRecord: { $max: "$timestamp" },
        },
      },
    ]);

    // Get daily location counts for the last 30 days
    const dailyStats = await Location.aggregate([
      {
        $match: {
          busId: require("mongoose").Types.ObjectId(busId),
          timestamp: {
            $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
          },
        },
      },
      {
        $group: {
          _id: {
            $dateToString: {
              format: "%Y-%m-%d",
              date: "$timestamp",
            },
          },
          count: { $sum: 1 },
          avgSpeed: { $avg: "$speed" },
        },
      },
      {
        $sort: { _id: 1 },
      },
    ]);

    return {
      overall: stats[0] || {},
      dailyStats,
    };
  }

  /**
   * Delete old location records (cleanup function)
   */
  async cleanupOldLocations(daysToKeep = 90) {
    const cutoffDate = new Date(Date.now() - daysToKeep * 24 * 60 * 60 * 1000);

    const result = await Location.deleteMany({
      timestamp: { $lt: cutoffDate },
    });

    logger.info(
      `Cleaned up ${result.deletedCount} old location records older than ${daysToKeep} days`
    );
    return result.deletedCount;
  }

  /**
   * Get real-time locations for route tracking
   */
  async getRouteLocations(routeId) {
    const buses = await Bus.find({ routeId, status: "active" }).select("_id");
    const busIds = buses.map((bus) => bus._id);

    if (busIds.length === 0) {
      return [];
    }

    const locations = await Location.aggregate([
      { $match: { busId: { $in: busIds } } },
      {
        $sort: { busId: 1, timestamp: -1 },
      },
      {
        $group: {
          _id: "$busId",
          latestLocation: { $first: "$$ROOT" },
        },
      },
      {
        $replaceRoot: { newRoot: "$latestLocation" },
      },
      {
        $lookup: {
          from: "buses",
          localField: "busId",
          foreignField: "_id",
          as: "bus",
        },
      },
      {
        $unwind: "$bus",
      },
      {
        $project: {
          busId: 1,
          location: 1,
          speed: 1,
          heading: 1,
          timestamp: 1,
          "bus.busNumber": 1,
          "bus.busType": 1,
        },
      },
      {
        $sort: { "bus.busNumber": 1 },
      },
    ]);

    return locations;
  }
}

module.exports = new LocationService();
