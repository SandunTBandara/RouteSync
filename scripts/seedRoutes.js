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
    isActive: true,
  },
  {
    routeNumber: "2",
    origin: "Colombo",
    destination: "Galle",
    distance: 119,
    estimatedDuration: 150,
    isActive: true,
  },
  {
    routeNumber: "177",
    origin: "Colombo",
    destination: "Matara",
    distance: 160,
    estimatedDuration: 210,
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
