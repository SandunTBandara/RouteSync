const mongoose = require("mongoose");

const busSchema = new mongoose.Schema(
  {
    busId: {
      type: String,
      unique: true,
      trim: true,
      index: true,
    },
    busNumber: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },

    routeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Route",
      required: true,
    },
    capacity: {
      type: Number,
      required: true,
      min: 1,
    },
    busType: {
      type: String,
      enum: ["Normal", "Semi Luxury", "Luxury", "Super Luxury"],
      required: true,
    },
    currentLocation: {
      type: {
        type: String,
        enum: ["Point"],
        default: "Point",
      },
      coordinates: {
        type: [Number], // [longitude, latitude]
        index: "2dsphere",
      },
    },
    status: {
      type: String,
      enum: ["active", "inactive", "maintenance"],
      default: "active",
    },
    lastUpdated: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

// Generate unique busId before saving
busSchema.pre("save", async function (next) {
  if (this.isNew && !this.busId) {
    try {
      // Generate unique busId with generic prefix
      const busPrefix = "BUS"; // Generic prefix for all buses

      // Generate unique 6-digit number
      let isUnique = false;
      let busId;
      let attempts = 0;
      const maxAttempts = 100;

      while (!isUnique && attempts < maxAttempts) {
        const randomNum = Math.floor(100000 + Math.random() * 900000); // 6-digit number
        busId = `${busPrefix}${randomNum}`;

        // Check if this busId already exists
        const existingBus = await this.constructor.findOne({ busId });
        if (!existingBus) {
          isUnique = true;
        }
        attempts++;
      }

      if (isUnique) {
        this.busId = busId;
      } else {
        // Fallback: use timestamp-based ID
        const timestamp = Date.now().toString().slice(-6);
        this.busId = `${busPrefix}${timestamp}`;
      }
    } catch (error) {
      // Fallback on error: use timestamp-based ID
      const timestamp = Date.now().toString().slice(-6);
      this.busId = `BUS${timestamp}`;
    }
  }
  next();
});

// Add index for better query performance
busSchema.index({ busId: 1 });

module.exports = mongoose.model("Bus", busSchema);
