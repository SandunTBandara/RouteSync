const mongoose = require("mongoose");

const operatorSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Operator name is required"],
      trim: true,
      maxlength: [100, "Operator name cannot exceed 100 characters"],
    },
    registrationNumber: {
      type: String,
      required: [true, "Registration number is required"],
      unique: true,
      trim: true,
    },
    contactInfo: {
      phone: {
        type: String,
        required: [true, "Phone number is required"],
        match: [/^\+94\d{9}$/, "Please enter a valid Sri Lankan phone number"],
      },
      email: {
        type: String,
        lowercase: true,
        match: [
          /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
          "Please enter a valid email",
        ],
      },
      address: {
        street: String,
        city: String,
        province: String,
        postalCode: String,
      },
    },
    licenseInfo: {
      licenseNumber: {
        type: String,
        required: [true, "License number is required"],
        unique: true,
      },
      issueDate: {
        type: Date,
        required: true,
      },
      expiryDate: {
        type: Date,
        required: true,
      },
      isValid: {
        type: Boolean,
        default: true,
      },
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    totalBuses: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

// Index for better query performance
operatorSchema.index({ name: 1, isActive: 1 });
operatorSchema.index({ registrationNumber: 1 });

// Virtual for checking if license is expired
operatorSchema.virtual("isLicenseExpired").get(function () {
  return this.licenseInfo.expiryDate < new Date();
});

// Ensure virtuals are included in JSON output
operatorSchema.set("toJSON", { virtuals: true });

module.exports = mongoose.model("Operator", operatorSchema);
