const mongoose = require("mongoose");
const User = require("../src/models/User");
const bcrypt = require("bcryptjs");
require("dotenv").config();

// Test users data
const testUsers = [
  {
    username: "testadmin",
    email: "testadmin@busroute.com",
    password: "admin123",
    firstName: "Test",
    lastName: "Admin",
    phone: "+94771234567",
    role: "admin",
    isActive: true,
  },
  {
    username: "testuser",
    email: "testuser@busroute.com",
    password: "user123",
    firstName: "Test",
    lastName: "User",
    phone: "+94771234568",
    role: "user",
    isActive: true,
  },
  {
    username: "johndoe",
    email: "john.doe@example.com",
    password: "password123",
    firstName: "John",
    lastName: "Doe",
    phone: "+94771234569",
    role: "user",
    isActive: true,
  },
  {
    username: "janesmith",
    email: "jane.smith@example.com",
    password: "password123",
    firstName: "Jane",
    lastName: "Smith",
    phone: "+94771234570",
    role: "user",
    isActive: true,
  },
];

const seedUsers = async () => {
  try {
    const mongoUri = process.env.MONGODB_URI;
    await mongoose.connect(mongoUri);
    console.log("Connected to MongoDB");

    await User.deleteMany({});
    console.log("Existing users cleared");

    const usersWithHashedPasswords = await Promise.all(
      testUsers.map(async (user) => {
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(user.password, salt);
        return {
          ...user,
          password: hashedPassword,
        };
      })
    );

    // Insert users
    await User.insertMany(usersWithHashedPasswords);

    console.log("✅ Test users seeded successfully:");
    console.log("📋 Created users:");
    testUsers.forEach((user) => {
      console.log(
        `  • ${user.role.toUpperCase()}: ${user.username} (${
          user.email
        }) - Password: ${user.password}`
      );
    });

    console.log("\n🔑 Login credentials for testing:");
    console.log("Admin Login:");
    console.log("  Username: testadmin");
    console.log("  Email: testadmin@busroute.com");
    console.log("  Password: admin123");
    console.log("\nUser Login:");
    console.log("  Username: testuser");
    console.log("  Email: testuser@busroute.com");
    console.log("  Password: user123");

    process.exit(0);
  } catch (error) {
    console.error("❌ User seeding failed:", error);
    process.exit(1);
  }
};

seedUsers();
