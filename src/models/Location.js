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
      min: 0,
      max: 300,
    },
    heading: {
      type: Number, // degrees (0-360)
      default: 0,
      min: 0,
      max: 360,
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
    versionKey: false, // Remove __v field
    toJSON: {
      transform: function (doc, ret) {
        delete ret.__v;
        return ret;
      },
    },
  }
);

// Create geospatial index for location queries
locationSchema.index({ location: "2dsphere" });
locationSchema.index({ busId: 1, timestamp: -1 });

module.exports = mongoose.model("Location", locationSchema);
