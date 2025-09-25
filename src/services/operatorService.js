const Operator = require("../models/Operator");
const Bus = require("../models/Bus");
const User = require("../models/User");
const logger = require("../utils/logger");

class OperatorService {
  /**
   * Get all operators with pagination and filtering
   */
  async getAllOperators(filters = {}) {
    const { page = 1, limit = 20, isActive, search } = filters;

    const filter = {};
    if (isActive !== undefined) filter.isActive = isActive === "true";

    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: "i" } },
        { registrationNumber: { $regex: search, $options: "i" } },
        { "contactInfo.email": { $regex: search, $options: "i" } },
      ];
    }

    const operators = await Operator.find(filter)
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .sort({ name: 1 });

    const totalOperators = await Operator.countDocuments(filter);

    // Add bus count for each operator
    const operatorsWithStats = await Promise.all(
      operators.map(async (operator) => {
        const busCount = await Bus.countDocuments({ operatorId: operator._id });
        const userCount = await User.countDocuments({
          operatorId: operator._id,
          role: { $in: ["operator", "driver"] },
        });

        return {
          ...operator.toObject(),
          totalBuses: busCount,
          totalUsers: userCount,
        };
      })
    );

    return {
      operators: operatorsWithStats,
      pagination: {
        totalOperators,
        totalPages: Math.ceil(totalOperators / limit),
        currentPage: page,
        count: operators.length,
      },
    };
  }

  /**
   * Get operator by ID
   */
  async getOperatorById(operatorId, user = null) {
    // Check access permissions
    if (
      user &&
      user.role === "operator" &&
      user.operatorId.toString() !== operatorId
    ) {
      throw new Error(
        "Access denied. You can only access your own operator information."
      );
    }

    const operator = await Operator.findById(operatorId);

    if (!operator) {
      throw new Error("Operator not found");
    }

    // Get additional statistics
    const stats = await this.getOperatorStats(operatorId);

    return {
      ...operator.toObject(),
      ...stats,
    };
  }

  /**
   * Create a new operator
   */
  async createOperator(operatorData) {
    const { name, registrationNumber, contactInfo, licenseInfo } = operatorData;

    // Check if operator with same registration number exists
    const existingOperator = await Operator.findOne({ registrationNumber });
    if (existingOperator) {
      throw new Error("Operator with this registration number already exists");
    }

    // Check if license number is unique
    const existingLicense = await Operator.findOne({
      "licenseInfo.licenseNumber": licenseInfo.licenseNumber,
    });
    if (existingLicense) {
      throw new Error("Operator with this license number already exists");
    }

    // Validate license dates
    const issueDate = new Date(licenseInfo.issueDate);
    const expiryDate = new Date(licenseInfo.expiryDate);

    if (expiryDate <= issueDate) {
      throw new Error("License expiry date must be after issue date");
    }

    if (expiryDate <= new Date()) {
      throw new Error("Cannot create operator with expired license");
    }

    const operator = await Operator.create({
      name,
      registrationNumber,
      contactInfo,
      licenseInfo: {
        ...licenseInfo,
        issueDate,
        expiryDate,
      },
    });

    logger.info(
      `New operator created: ${operator.name} (${operator.registrationNumber})`
    );
    return operator;
  }

  /**
   * Update operator information
   */
  async updateOperator(operatorId, updateData, user = null) {
    // Check access permissions
    if (
      user &&
      user.role === "operator" &&
      user.operatorId.toString() !== operatorId
    ) {
      throw new Error(
        "Access denied. You can only update your own operator information."
      );
    }

    const { name, contactInfo, licenseInfo, isActive } = updateData;

    const operator = await Operator.findById(operatorId);
    if (!operator) {
      throw new Error("Operator not found");
    }

    // Validate license information if provided
    if (licenseInfo) {
      const issueDate = new Date(licenseInfo.issueDate);
      const expiryDate = new Date(licenseInfo.expiryDate);

      if (expiryDate <= issueDate) {
        throw new Error("License expiry date must be after issue date");
      }

      // Check if license number is unique (excluding current operator)
      if (licenseInfo.licenseNumber !== operator.licenseInfo.licenseNumber) {
        const existingLicense = await Operator.findOne({
          "licenseInfo.licenseNumber": licenseInfo.licenseNumber,
          _id: { $ne: operatorId },
        });
        if (existingLicense) {
          throw new Error(
            "Another operator with this license number already exists"
          );
        }
      }
    }

    const updatedOperator = await Operator.findByIdAndUpdate(
      operatorId,
      {
        name,
        contactInfo,
        licenseInfo: licenseInfo
          ? {
              ...licenseInfo,
              issueDate: new Date(licenseInfo.issueDate),
              expiryDate: new Date(licenseInfo.expiryDate),
            }
          : operator.licenseInfo,
        isActive,
      },
      { new: true, runValidators: true }
    );

    logger.info(`Operator updated: ${updatedOperator.name}`);
    return updatedOperator;
  }

  /**
   * Delete operator
   */
  async deleteOperator(operatorId) {
    const operator = await Operator.findById(operatorId);
    if (!operator) {
      throw new Error("Operator not found");
    }

    // Check if operator has buses
    const busCount = await Bus.countDocuments({ operatorId });
    if (busCount > 0) {
      throw new Error(
        "Cannot delete operator. There are buses assigned to this operator."
      );
    }

    // Check if operator has users
    const userCount = await User.countDocuments({ operatorId });
    if (userCount > 0) {
      throw new Error(
        "Cannot delete operator. There are users assigned to this operator."
      );
    }

    await Operator.findByIdAndDelete(operatorId);

    logger.info(`Operator deleted: ${operator.name}`);
    return true;
  }

  /**
   * Get operator statistics
   */
  async getOperatorStats(operatorId) {
    const totalBuses = await Bus.countDocuments({ operatorId });
    const activeBuses = await Bus.countDocuments({
      operatorId,
      status: "active",
    });
    const inactiveBuses = await Bus.countDocuments({
      operatorId,
      status: "inactive",
    });
    const maintenanceBuses = await Bus.countDocuments({
      operatorId,
      status: "maintenance",
    });

    const totalUsers = await User.countDocuments({ operatorId });
    const operators = await User.countDocuments({
      operatorId,
      role: "operator",
    });
    const drivers = await User.countDocuments({ operatorId, role: "driver" });

    // Get bus type distribution
    const busTypeStats = await Bus.aggregate([
      {
        $match: { operatorId: require("mongoose").Types.ObjectId(operatorId) },
      },
      {
        $group: {
          _id: "$busType",
          count: { $sum: 1 },
        },
      },
    ]);

    return {
      totalBuses,
      activeBuses,
      inactiveBuses,
      maintenanceBuses,
      totalUsers,
      operators,
      drivers,
      busTypeStats,
    };
  }

  /**
   * Get buses by operator
   */
  async getOperatorBuses(operatorId, filters = {}, user = null) {
    // Check access permissions
    if (
      user &&
      user.role === "operator" &&
      user.operatorId.toString() !== operatorId
    ) {
      throw new Error(
        "Access denied. You can only access buses from your operator."
      );
    }

    const { page = 1, limit = 20, status, routeId } = filters;

    const filter = { operatorId };
    if (status) filter.status = status;
    if (routeId) filter.routeId = routeId;

    const buses = await Bus.find(filter)
      .populate("routeId", "routeNumber origin destination")
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .sort({ busNumber: 1 });

    const totalBuses = await Bus.countDocuments(filter);

    return {
      buses,
      pagination: {
        totalBuses,
        totalPages: Math.ceil(totalBuses / limit),
        currentPage: page,
        count: buses.length,
      },
    };
  }

  /**
   * Get users by operator
   */
  async getOperatorUsers(operatorId, filters = {}, user = null) {
    // Check access permissions
    if (
      user &&
      user.role === "operator" &&
      user.operatorId.toString() !== operatorId
    ) {
      throw new Error(
        "Access denied. You can only access users from your operator."
      );
    }

    const { page = 1, limit = 20, role, isActive } = filters;

    const filter = { operatorId };
    if (role) filter.role = role;
    if (isActive !== undefined) filter.isActive = isActive === "true";

    const users = await User.find(filter)
      .populate("assignedBusId", "busNumber")
      .select("-password")
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .sort({ createdAt: -1 });

    const totalUsers = await User.countDocuments(filter);

    return {
      users,
      pagination: {
        totalUsers,
        totalPages: Math.ceil(totalUsers / limit),
        currentPage: page,
        count: users.length,
      },
    };
  }

  /**
   * Check license expiry status
   */
  async checkLicenseExpiry(operatorId) {
    const operator = await Operator.findById(operatorId);
    if (!operator) {
      throw new Error("Operator not found");
    }

    const now = new Date();
    const expiryDate = new Date(operator.licenseInfo.expiryDate);
    const daysUntilExpiry = Math.ceil(
      (expiryDate - now) / (1000 * 60 * 60 * 24)
    );

    return {
      isExpired: expiryDate < now,
      daysUntilExpiry,
      expiryDate,
      isValid: operator.licenseInfo.isValid,
    };
  }

  /**
   * Get operators with expiring licenses
   */
  async getOperatorsWithExpiringLicenses(daysThreshold = 30) {
    const thresholdDate = new Date();
    thresholdDate.setDate(thresholdDate.getDate() + daysThreshold);

    const operators = await Operator.find({
      "licenseInfo.expiryDate": { $lte: thresholdDate },
      isActive: true,
    }).sort({ "licenseInfo.expiryDate": 1 });

    return operators.map((operator) => {
      const now = new Date();
      const expiryDate = new Date(operator.licenseInfo.expiryDate);
      const daysUntilExpiry = Math.ceil(
        (expiryDate - now) / (1000 * 60 * 60 * 24)
      );

      return {
        ...operator.toObject(),
        daysUntilExpiry,
        isExpired: expiryDate < now,
      };
    });
  }

  /**
   * Toggle operator active status
   */
  async toggleOperatorStatus(operatorId) {
    const operator = await Operator.findById(operatorId);
    if (!operator) {
      throw new Error("Operator not found");
    }

    operator.isActive = !operator.isActive;
    await operator.save();

    // If deactivating, also deactivate all buses and users
    if (!operator.isActive) {
      await Bus.updateMany({ operatorId }, { status: "inactive" });

      await User.updateMany({ operatorId }, { isActive: false });
    }

    logger.info(
      `Operator ${operator.name} status changed to: ${
        operator.isActive ? "active" : "inactive"
      }`
    );
    return operator;
  }

  /**
   * Get operator dashboard data
   */
  async getOperatorDashboard(operatorId, user = null) {
    // Check access permissions
    if (
      user &&
      user.role === "operator" &&
      user.operatorId.toString() !== operatorId
    ) {
      throw new Error(
        "Access denied. You can only access your own operator dashboard."
      );
    }

    const operator = await Operator.findById(operatorId);
    if (!operator) {
      throw new Error("Operator not found");
    }

    const stats = await this.getOperatorStats(operatorId);
    const licenseStatus = await this.checkLicenseExpiry(operatorId);

    // Get recent activity (last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const recentUsers = await User.countDocuments({
      operatorId,
      createdAt: { $gte: sevenDaysAgo },
    });

    return {
      operator,
      stats,
      licenseStatus,
      recentActivity: {
        newUsers: recentUsers,
      },
    };
  }
}

module.exports = new OperatorService();
