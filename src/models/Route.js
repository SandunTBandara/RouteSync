const mongoose = require("mongoose");

const routeSchema = new mongoose.Schema(
  {
    routeNumber: {
      type: String,
      required: true,
      unique: true,
    },
    origin: {
      type: String,
      required: true,
    },
    destination: {
      type: String,
      required: true,
    },
    waypoints: [
      {
        name: String,
        location: {
          type: {
            type: String,
            enum: ["Point"],
            default: "Point",
          },
          coordinates: [Number], // [longitude, latitude]
        },
        estimatedTime: Number, // minutes from origin
      },
    ],
    distance: {
      type: Number, // in kilometers
      required: true,
    },
    estimatedDuration: {
      type: Number, // in minutes
      required: true,
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

module.exports = mongoose.model("Route", routeSchema);
