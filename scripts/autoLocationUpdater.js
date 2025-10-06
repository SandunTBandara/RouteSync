const cron = require("node-cron");
const axios = require("axios");
require("dotenv").config();

// Configuration
const CONFIG = {
  API_BASE_URL: process.env.API_BASE_URL || "http://localhost:3000/api/v1",
  BUS_ID: "68e3eacb298d04eae5197d71", // Your specific bus ID
  UPDATE_INTERVAL: "*/1 * * * *", // Every 1 minutes
  ADMIN_EMAIL: "testadmin@busroute.com",
  ADMIN_PASSWORD: "admin123",
};

let authToken = null;

// Function to get authentication token
async function getAuthToken() {
  try {
    console.log("🔑 Authenticating...");
    const response = await axios.post(`${CONFIG.API_BASE_URL}/auth/login`, {
      login: CONFIG.ADMIN_EMAIL,
      password: CONFIG.ADMIN_PASSWORD,
    });

    authToken = response.data.data.accessToken;
    console.log("✅ Authentication successful");
    return authToken;
  } catch (error) {
    console.error(
      "❌ Authentication failed:",
      error.response?.data || error.message
    );
    throw error;
  }
}

// Function to generate realistic GPS coordinates (simulate bus movement)
function generateLocationData() {
  // Simulate movement in Colombo area (you can change this to any area)
  const baseLatitude = 6.9271; // Colombo
  const baseLongitude = 79.8612;

  // Add small random variations to simulate realistic bus movement
  const latitudeVariation = (Math.random() - 0.5) * 0.01; // ~1km variation
  const longitudeVariation = (Math.random() - 0.5) * 0.01;

  const latitude = baseLatitude + latitudeVariation;
  const longitude = baseLongitude + longitudeVariation;
  const speed = Math.floor(Math.random() * 60) + 20; // 20-80 km/h
  const heading = Math.floor(Math.random() * 360); // 0-360 degrees

  return {
    longitude: parseFloat(longitude.toFixed(6)),
    latitude: parseFloat(latitude.toFixed(6)),
    speed,
    heading,
  };
}

// Function to update bus location
async function updateBusLocation() {
  try {
    // Ensure we have a valid token
    if (!authToken) {
      await getAuthToken();
    }

    const locationData = generateLocationData();

    console.log(`🚌 Updating location for bus ${CONFIG.BUS_ID}...`);
    console.log(
      `📍 Coordinates: ${locationData.latitude}, ${locationData.longitude}`
    );
    console.log(
      `🏃 Speed: ${locationData.speed} km/h, Heading: ${locationData.heading}°`
    );

    const response = await axios.post(
      `${CONFIG.API_BASE_URL}/locations/bus/${CONFIG.BUS_ID}/update`,
      locationData,
      {
        headers: {
          Authorization: `Bearer ${authToken}`,
          "Content-Type": "application/json",
        },
        timeout: 10000, // 10 second timeout
      }
    );

    console.log("✅ Location updated successfully:", new Date().toISOString());
    console.log("📊 Response:", response.data.message);
    console.log("🆔 Location ID:", response.data.data?._id || "N/A");
    console.log("---");
  } catch (error) {
    if (error.response?.status === 401) {
      console.log("🔄 Token expired, refreshing...");
      try {
        authToken = null; // Clear expired token
        await getAuthToken();
        await updateBusLocation(); // Retry with new token
      } catch (retryError) {
        console.error(
          "❌ Retry failed:",
          retryError.response?.data || retryError.message
        );
      }
    } else if (error.code === "ECONNREFUSED") {
      console.error("❌ Connection refused - Is the API server running?");
    } else if (error.code === "ENOTFOUND") {
      console.error("❌ DNS lookup failed - Check API URL");
    } else {
      console.error(
        "❌ Location update failed:",
        error.response?.data || error.message
      );
    }
  }
}

// Function to validate bus exists
async function validateBus() {
  try {
    if (!authToken) {
      await getAuthToken();
    }

    const response = await axios.get(
      `${CONFIG.API_BASE_URL}/locations/bus/${CONFIG.BUS_ID}/latest`,
      {
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      }
    );

    console.log("✅ Bus validation successful");
    return true;
  } catch (error) {
    if (error.response?.status === 404) {
      console.log("⚠️ Bus not found in system, but will continue with updates");
      return true; // Continue anyway, bus might exist but have no location data yet
    } else if (error.response?.status === 401) {
      console.log("🔄 Token expired during validation, refreshing...");
      authToken = null;
      await getAuthToken();
      return await validateBus();
    } else {
      console.error(
        "❌ Bus validation failed:",
        error.response?.data || error.message
      );
      return false;
    }
  }
}

// Function to start the automated location updates
async function startLocationUpdater() {
  console.log("🚀 Starting automated location updater...");
  console.log("=".repeat(50));
  console.log(`🚌 Bus ID: ${CONFIG.BUS_ID}`);
  console.log(`⏰ Update interval: Every 5 minutes`);
  console.log(`🌐 API URL: ${CONFIG.API_BASE_URL}`);
  console.log(`👤 Admin User: ${CONFIG.ADMIN_EMAIL}`);
  console.log("=".repeat(50));

  // Get initial authentication
  try {
    await getAuthToken();
  } catch (error) {
    console.error("❌ Failed to get initial authentication. Exiting...");
    process.exit(1);
  }

  // Validate bus exists
  try {
    await validateBus();
  } catch (error) {
    console.error("❌ Bus validation failed. Continuing anyway...");
  }

  // Schedule the cron job
  console.log("⏰ Scheduling cron job...");
  cron.schedule(
    CONFIG.UPDATE_INTERVAL,
    () => {
      console.log(
        `\n⏰ ${new Date().toISOString()} - Running scheduled location update...`
      );
      updateBusLocation();
    },
    {
      scheduled: true,
      timezone: "Asia/Colombo", // Set to Sri Lanka timezone
    }
  );

  // Run initial update
  console.log("🎯 Running initial location update...");
  await updateBusLocation();

  console.log("\n✅ Automated location updater is now running!");
  console.log("📅 Next update scheduled in 5 minutes");
  console.log("💡 Press Ctrl+C to stop");
  console.log("📊 Monitor the console for update logs...\n");
}

// Function to display help information
function displayHelp() {
  console.log(`
🚌 Automated Bus Location Updater
=================================

This script automatically updates the location of bus ${CONFIG.BUS_ID} every 5 minutes.

Configuration:
- Bus ID: ${CONFIG.BUS_ID}
- API URL: ${CONFIG.API_BASE_URL}
- Update Interval: Every 1 minutes
- Timezone: Asia/Colombo

To customize:
1. Edit the CONFIG object in this file
2. Set environment variables in .env file
3. Change BUS_ID to your target bus

Environment Variables:
- API_BASE_URL: Base URL for the API (default: http://localhost:3000/api/v1)

Commands:
- pnpm location-updater: Start the updater
- Ctrl+C: Stop the updater
  `);
}

// Handle command line arguments
if (process.argv.includes("--help") || process.argv.includes("-h")) {
  displayHelp();
  process.exit(0);
}

// Handle graceful shutdown
process.on("SIGINT", () => {
  console.log("\n🛑 Shutting down automated location updater...");
  console.log("📊 Final statistics:");
  console.log(`🚌 Bus ID: ${CONFIG.BUS_ID}`);
  console.log(`⏰ Last run: ${new Date().toISOString()}`);
  console.log("👋 Goodbye!");
  process.exit(0);
});

process.on("SIGTERM", () => {
  console.log("\n🛑 Received SIGTERM, shutting down gracefully...");
  process.exit(0);
});

// Handle uncaught exceptions
process.on("uncaughtException", (error) => {
  console.error("❌ Uncaught Exception:", error);
  process.exit(1);
});

process.on("unhandledRejection", (reason, promise) => {
  console.error("❌ Unhandled Rejection at:", promise, "reason:", reason);
  process.exit(1);
});

// Start the updater
startLocationUpdater().catch((error) => {
  console.error("❌ Failed to start location updater:", error);
  process.exit(1);
});
