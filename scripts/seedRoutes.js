const mongoose = require("mongoose");
const Route = require("../src/models/Route");

// Sample Sri Lankan bus routes
const sampleRoutes = [
  {
    routeNumber: "87",
    origin: "Colombo",
    destination: "Kandy",
    distance: 116,
    estimatedDuration: 180,
    waypoints: [
      {
        name: "Kadawatha",
        location: {
          type: "Point",
          coordinates: [79.9935, 7.0907],
        },
        estimatedTime: 30,
      },
      {
        name: "Kegalle",
        location: {
          type: "Point",
          coordinates: [80.3431, 7.2513],
        },
        estimatedTime: 90,
      },
      {
        name: "Mawanella",
        location: {
          type: "Point",
          coordinates: [80.4542, 7.2478],
        },
        estimatedTime: 120,
      },
    ],
    isActive: true,
  },
  {
    routeNumber: "2",
    origin: "Colombo",
    destination: "Galle",
    distance: 119,
    estimatedDuration: 150,
    waypoints: [
      {
        name: "Panadura",
        location: {
          type: "Point",
          coordinates: [79.9037, 6.7132],
        },
        estimatedTime: 45,
      },
      {
        name: "Kalutara",
        location: {
          type: "Point",
          coordinates: [79.9595, 6.5854],
        },
        estimatedTime: 60,
      },
      {
        name: "Bentota",
        location: {
          type: "Point",
          coordinates: [80.0021, 6.4268],
        },
        estimatedTime: 90,
      },
    ],
    isActive: true,
  },
  {
    routeNumber: "177",
    origin: "Colombo",
    destination: "Matara",
    distance: 160,
    estimatedDuration: 210,
    waypoints: [
      {
        name: "Moratuwa",
        location: {
          type: "Point",
          coordinates: [79.8816, 6.7733],
        },
        estimatedTime: 30,
      },
      {
        name: "Aluthgama",
        location: {
          type: "Point",
          coordinates: [80.0021, 6.4268],
        },
        estimatedTime: 75,
      },
      {
        name: "Hikkaduwa",
        location: {
          type: "Point",
          coordinates: [80.099, 6.1387],
        },
        estimatedTime: 120,
      },
    ],
    isActive: true,
  },
];

const seedRoutes = async () => {
  try {
    await mongoose.connect("mongodb://localhost:27017/ntc-bus-tracking");
    console.log("Connected to MongoDB");

    // Clear existing routes (optional)
    await Route.deleteMany({});
    console.log("Existing routes cleared");

    // Insert sample routes
    await Route.insertMany(sampleRoutes);

    console.log("✅ Routes seeded successfully:");
    console.log("📋 Created routes:");
    sampleRoutes.forEach((route) => {
      console.log(
        `  • Route ${route.routeNumber}: ${route.origin} → ${route.destination} (${route.distance}km)`
      );
    });

    console.log(`\n🎯 Total routes created: ${sampleRoutes.length}`);

    process.exit(0);
  } catch (error) {
    console.error("❌ Route seeding failed:", error);
    process.exit(1);
  }
};

seedRoutes();
