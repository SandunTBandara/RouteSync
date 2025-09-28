const express = require("express");
const router = express.Router();

// Test route
router.get("/test", (req, res) => {
  res.json({ success: true, message: "Location routes working!" });
});

// Test controller import
try {
  const locationController = require("../controllers/locationController");
  console.log("Location controller imported successfully");
  console.log("Available functions:", Object.keys(locationController));
} catch (error) {
  console.error("Error importing location controller:", error.message);
}

module.exports = router;
