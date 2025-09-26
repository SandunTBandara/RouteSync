const Route = require("../models/Route");
const Bus = require("../models/Bus");
const logger = require("../utils/logger");

class RouteService {
  /**
   * Get all routes with pagination and filtering
   */
  async getAllRoutes(filters = {}) {
    const {
      page = 1,
      limit = 20,
      origin,
      destination,
      isActive,
      search,
    } = filters;

    const filter = {};
    if (origin) filter.origin = { $regex: origin, $options: "i" };
    if (destination)
      filter.destination = { $regex: destination, $options: "i" };
    if (isActive !== undefined) filter.isActive = isActive === "true";

    if (search) {
      filter.$or = [
        { routeNumber: { $regex: search, $options: "i" } },
        { origin: { $regex: search, $options: "i" } },
        { destination: { $regex: search, $options: "i" } },
      ];
    }

    const routes = await Route.find(filter)
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .sort({ routeNumber: 1 });

    const totalRoutes = await Route.countDocuments(filter);

    return {
      routes,
      pagination: {
        totalRoutes,
        totalPages: Math.ceil(totalRoutes / limit),
        currentPage: page,
        count: routes.length,
      },
    };
  }

  /**
   * Get route by ID
   */
  async getRouteById(routeId) {
    const route = await Route.findById(routeId);

    if (!route) {
      throw new Error("Route not found");
    }

    // Get buses on this route
    const buses = await Bus.find({ routeId, status: "active" })
      .populate("operatorId", "name")
      .select("busNumber busType currentLocation lastUpdated");

    return {
      route,
      buses,
    };
  }

  /**
   * Create a new route
   */
  async createRoute(routeData) {
    const {
      routeNumber,
      origin,
      destination,
      waypoints = [],
      distance,
      estimatedDuration,
    } = routeData;

    // Check if route number already exists
    const existingRoute = await Route.findOne({ routeNumber });
    if (existingRoute) {
      throw new Error("Route with this number already exists");
    }

    // Validate waypoints structure
    if (waypoints && waypoints.length > 0) {
      for (const waypoint of waypoints) {
        if (
          !waypoint.name ||
          !waypoint.location ||
          !waypoint.location.coordinates
        ) {
          throw new Error(
            "Invalid waypoint structure. Each waypoint must have name and location coordinates."
          );
        }

        const [lng, lat] = waypoint.location.coordinates;
        if (lng < -180 || lng > 180 || lat < -90 || lat > 90) {
          throw new Error("Invalid waypoint coordinates");
        }
      }
    }

    const route = await Route.create({
      routeNumber,
      origin,
      destination,
      waypoints,
      distance,
      estimatedDuration,
    });

    logger.info(
      `New route created: ${route.routeNumber} (${route.origin} - ${route.destination})`
    );
    return route;
  }

  /**
   * Update route information
   */
  async updateRoute(routeId, updateData) {
    const {
      origin,
      destination,
      waypoints,
      distance,
      estimatedDuration,
      isActive,
    } = updateData;

    // Validate waypoints if provided
    if (waypoints && waypoints.length > 0) {
      for (const waypoint of waypoints) {
        if (
          !waypoint.name ||
          !waypoint.location ||
          !waypoint.location.coordinates
        ) {
          throw new Error("Invalid waypoint structure");
        }

        const [lng, lat] = waypoint.location.coordinates;
        if (lng < -180 || lng > 180 || lat < -90 || lat > 90) {
          throw new Error("Invalid waypoint coordinates");
        }
      }
    }

    const route = await Route.findByIdAndUpdate(
      routeId,
      {
        origin,
        destination,
        waypoints,
        distance,
        estimatedDuration,
        isActive,
      },
      { new: true, runValidators: true }
    );

    if (!route) {
      throw new Error("Route not found");
    }

    logger.info(`Route updated: ${route.routeNumber}`);
    return route;
  }

  /**
   * Delete route
   */
  async deleteRoute(routeId) {
    const route = await Route.findById(routeId);
    if (!route) {
      throw new Error("Route not found");
    }

    // Check if there are buses assigned to this route
    const busesOnRoute = await Bus.countDocuments({ routeId });
    if (busesOnRoute > 0) {
      throw new Error(
        "Cannot delete route. There are buses currently assigned to this route."
      );
    }

    await Route.findByIdAndDelete(routeId);

    logger.info(`Route deleted: ${route.routeNumber}`);
    return true;
  }

  /**
   * Search routes by origin and destination
   */
  async searchRoutes(searchParams) {
    const { origin, destination, maxDistance } = searchParams;

    const filter = {};

    if (origin) {
      filter.origin = { $regex: origin, $options: "i" };
    }

    if (destination) {
      filter.destination = { $regex: destination, $options: "i" };
    }

    if (maxDistance) {
      filter.distance = { $lte: maxDistance };
    }

    filter.isActive = true;

    const routes = await Route.find(filter).sort({
      distance: 1,
      estimatedDuration: 1,
    });

    return routes;
  }

  /**
   * Get routes within a geographic area
   */
  async getRoutesInArea(bounds) {
    const { northEast, southWest } = bounds;

    // This is a simplified version - in reality, you'd want to check if route waypoints
    // or origin/destination fall within the bounds
    const routes = await Route.find({
      isActive: true,
      $or: [
        {
          "waypoints.location": {
            $geoWithin: {
              $box: [
                [southWest.lng, southWest.lat],
                [northEast.lng, northEast.lat],
              ],
            },
          },
        },
      ],
    });

    return routes;
  }

  /**
   * Get route statistics
   */
  async getRouteStats() {
    const totalRoutes = await Route.countDocuments();
    const activeRoutes = await Route.countDocuments({ isActive: true });
    const inactiveRoutes = await Route.countDocuments({ isActive: false });

    // Average distance and duration
    const avgStats = await Route.aggregate([
      {
        $group: {
          _id: null,
          avgDistance: { $avg: "$distance" },
          avgDuration: { $avg: "$estimatedDuration" },
          maxDistance: { $max: "$distance" },
          minDistance: { $min: "$distance" },
        },
      },
    ]);

    // Routes with most buses
    const routesWithBuses = await Route.aggregate([
      {
        $lookup: {
          from: "buses",
          localField: "_id",
          foreignField: "routeId",
          as: "buses",
        },
      },
      {
        $project: {
          routeNumber: 1,
          origin: 1,
          destination: 1,
          busCount: { $size: "$buses" },
        },
      },
      {
        $sort: { busCount: -1 },
      },
      {
        $limit: 10,
      },
    ]);

    return {
      totalRoutes,
      activeRoutes,
      inactiveRoutes,
      averageStats: avgStats[0] || {},
      popularRoutes: routesWithBuses,
    };
  }

  /**
   * Get buses currently on route
   */
  async getBusesOnRoute(routeId) {
    const route = await Route.findById(routeId);
    if (!route) {
      throw new Error("Route not found");
    }

    const buses = await Bus.find({ routeId, status: "active" })
      .populate("operatorId", "name contactInfo")
      .sort({ lastUpdated: -1 });

    return {
      route,
      buses,
      busCount: buses.length,
    };
  }

  /**
   * Calculate estimated travel time between waypoints
   */
  calculateWaypointTimes(waypoints, totalDuration) {
    if (!waypoints || waypoints.length === 0) {
      return waypoints;
    }

    // Simple calculation - distribute time evenly across waypoints
    // In a real application, you'd use actual distance calculations
    const timePerWaypoint = totalDuration / (waypoints.length + 1);

    return waypoints.map((waypoint, index) => ({
      ...waypoint,
      estimatedTime: Math.round(timePerWaypoint * (index + 1)),
    }));
  }

  /**
   * Get route by number
   */
  async getRouteByNumber(routeNumber) {
    const route = await Route.findOne({ routeNumber });

    if (!route) {
      throw new Error("Route not found");
    }

    return route;
  }

  /**
   * Toggle route active status
   */
  async toggleRouteStatus(routeId) {
    const route = await Route.findById(routeId);
    if (!route) {
      throw new Error("Route not found");
    }

    route.isActive = !route.isActive;
    await route.save();

    logger.info(
      `Route ${route.routeNumber} status changed to: ${
        route.isActive ? "active" : "inactive"
      }`
    );
    return route;
  }
}

module.exports = new RouteService();
