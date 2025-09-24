const mongoose = require("mongoose");

const locationSchema = new mongoose.Schema(
  {
    busId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Bus",
      required: true,
    },
    location: {
      type: {
        type: String,
        enum: ["Point"],
        default: "Point",
      },
      coordinates: {
        type: [Number], // [longitude, latitude]
        required: true,
      },
    },
    speed: {
      type: Number, // km/h
      default: 0,
    },
    heading: {
      type: Number, // degrees (0-360)
      default: 0,
    },
    accuracy: {
      type: Number, // in meters
      default: 0,
    },
    timestamp: {
      type: Date,
      default: Date.now,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

// Create geospatial index for location queries
locationSchema.index({ location: "2dsphere" });
locationSchema.index({ busId: 1, timestamp: -1 });

module.exports = mongoose.model("Location", locationSchema);
