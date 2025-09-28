const mongoose = require("mongoose");
const Location = require("../src/models/Location");
const Bus = require("../src/models/Bus");
const logger = require("../src/utils/logger");

// Sample locations around Colombo, Sri Lanka
const sampleLocations = [
  // Colombo area coordinates
  [79.8612, 6.9271], // Colombo Fort
  [79.8541, 6.9147], // Pettah
  [79.8523, 6.9341], // Maradana
  [79.8706, 6.9319], // Bambalapitiya
  [79.875, 6.9147], // Wellawatte
  [79.885, 6.9], // Mount Lavinia
  [79.84, 6.95], // Kelaniya
  [79.92, 6.91], // Nugegoda
  [79.9, 6.89], // Dehiwala
  [79.83, 6.96], // Wattala
];

// Generate speed and heading values
const generateLocationData = (coordinates, busId, baseTime) => {
  return {
    busId: busId,
    location: {
      type: "Point",
      coordinates: coordinates,
    },
    speed: Math.floor(Math.random() * 60) + 10, // 10-70 km/h
    heading: Math.floor(Math.random() * 360), // 0-360 degrees
    timestamp: new Date(baseTime + Math.random() * 3600000), // Random within 1 hour
    isActive: true,
  };
};

const seedLocations = async () => {
  try {
    // Connect to database
    const dbConnection =
      process.env.MONGODB_URI || "mongodb://localhost:27017/bus-route-api";
    await mongoose.connect(dbConnection);
    logger.info("Connected to MongoDB for location seeding");

    // Clear existing locations
    await Location.deleteMany({});
    logger.info("Cleared existing locations");

    // Get all buses
    const buses = await Bus.find({}).select("_id busNumber");
    if (buses.length === 0) {
      logger.warn("No buses found. Please seed buses first.");
      return;
    }

    const locations = [];
    const now = Date.now();

    // Generate location data for each bus
    buses.forEach((bus, busIndex) => {
      // Generate 10-20 location points per bus over the last 24 hours
      const pointCount = Math.floor(Math.random() * 11) + 10; // 10-20 points

      for (let i = 0; i < pointCount; i++) {
        // Use different coordinates for variety
        const coordIndex = (busIndex + i) % sampleLocations.length;
        const baseCoords = sampleLocations[coordIndex];

        // Add small random variations to coordinates
        const coords = [
          baseCoords[0] + (Math.random() - 0.5) * 0.01, // ±0.005 degrees longitude
          baseCoords[1] + (Math.random() - 0.5) * 0.01, // ±0.005 degrees latitude
        ];

        // Generate timestamp over last 24 hours
        const hoursAgo = Math.random() * 24;
        const timestamp = new Date(now - hoursAgo * 3600000);

        locations.push(
          generateLocationData(coords, bus._id, timestamp.getTime())
        );
      }
    });

    // Insert all locations
    const createdLocations = await Location.insertMany(locations);
    logger.info(
      `Successfully seeded ${createdLocations.length} location records`
    );

    // Log summary by bus
    const summary = await Location.aggregate([
      {
        $group: {
          _id: "$busId",
          count: { $sum: 1 },
          avgSpeed: { $avg: "$speed" },
          latestTimestamp: { $max: "$timestamp" },
        },
      },
      {
        $lookup: {
          from: "buses",
          localField: "_id",
          foreignField: "_id",
          as: "bus",
        },
      },
      {
        $unwind: "$bus",
      },
      {
        $project: {
          busNumber: "$bus.busNumber",
          count: 1,
          avgSpeed: { $round: ["$avgSpeed", 1] },
          latestTimestamp: 1,
        },
      },
    ]);

    logger.info("Location seeding summary:");
    summary.forEach((item) => {
      logger.info(
        `Bus ${item.busNumber}: ${item.count} locations, avg speed: ${item.avgSpeed} km/h`
      );
    });

    logger.info("Location seeding completed successfully!");
  } catch (error) {
    logger.error("Error seeding locations:", error);
  } finally {
    await mongoose.disconnect();
    logger.info("Disconnected from MongoDB");
  }
};

// Check if this script is being run directly
if (require.main === module) {
  seedLocations().catch(console.error);
}

module.exports = { seedLocations };
