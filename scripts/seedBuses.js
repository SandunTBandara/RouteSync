const mongoose = require("mongoose");
const Bus = require("../src/models/Bus");
const Route = require("../src/models/Route");
const Operator = require("../src/models/Operator");

const sriLankanRoutes = [
  {
    routeNumber: "87",
    origin: "Colombo",
    destination: "Kandy",
    distance: 116,
    estimatedDuration: 180,
    waypoints: [
      { name: "Kadawatha", coordinates: [79.9935, 7.0907], estimatedTime: 30 },
      { name: "Kegalle", coordinates: [80.3431, 7.2513], estimatedTime: 90 },
      { name: "Mawanella", coordinates: [80.4542, 7.2478], estimatedTime: 120 },
    ],
  },
  {
    routeNumber: "2",
    origin: "Colombo",
    destination: "Galle",
    distance: 119,
    estimatedDuration: 150,
    waypoints: [
      { name: "Panadura", coordinates: [79.9037, 6.7132], estimatedTime: 45 },
      { name: "Kalutara", coordinates: [79.9595, 6.5854], estimatedTime: 60 },
      { name: "Bentota", coordinates: [80.0021, 6.4268], estimatedTime: 90 },
    ],
  },
];

const seedDatabase = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);

    // Create sample operator
    const operator = await Operator.create({
      name: "Sri Lanka Transport Board",
      contactInfo: {
        phone: "+94112123456",
        email: "info@sltb.lk",
      },
    });

    // Create routes
    const routes = await Route.insertMany(sriLankanRoutes);

    // Create sample buses
    const buses = [];
    for (let i = 1; i <= 25; i++) {
      buses.push({
        busNumber: `NB-${String(i).padStart(4, "0")}`,
        operatorId: operator._id,
        routeId: routes[i % routes.length]._id,
        capacity: Math.floor(Math.random() * 30) + 35, // 35-65 seats
        busType: ["Normal", "Semi Luxury", "Luxury", "Super Luxury"][
          Math.floor(Math.random() * 4)
        ],
        currentLocation: {
          type: "Point",
          coordinates: [
            79.8612 + (Math.random() - 0.5) * 0.1,
            6.9271 + (Math.random() - 0.5) * 0.1,
          ],
        },
        status: "active",
      });
    }

    await Bus.insertMany(buses);
    console.log("Database seeded successfully");
    process.exit(0);
  } catch (error) {
    console.error("Seeding failed:", error);
    process.exit(1);
  }
};

seedDatabase();
