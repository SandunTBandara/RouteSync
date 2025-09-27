const User = require("../models/User");
const logger = require("../utils/logger");

class UserService {
  /**
   * Check if user exists by email or username
   */
  async checkUserExists(email, username) {
    return await User.findOne({
      $or: [{ email }, { username }],
    });
  }

  /**
   * Create a new user
   */
  async createUser(userData) {
    const {
      username,
      email,
      password,
      firstName,
      lastName,
      phone,
      role = "user",
    } = userData;

    // Create user
    const user = await User.create({
      username,
      email,
      password,
      firstName,
      lastName,
      phone,
      role,
    });

    logger.info(`New user created: ${user.email} with role: ${user.role}`);
    return user;
  }

  /**
   * Authenticate user with login credentials
   **/
  async authenticateUser(login, password) {
    // Find user by email or username
    const user = await User.findOne({
      $or: [{ email: login }, { username: login }],
    }).select("+password");

    if (!user) {
      throw new Error("Invalid credentials");
    }

    // Check if user is active
    if (!user.isActive) {
      throw new Error("Account is inactive. Please contact administrator.");
    }

    // Check password
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      throw new Error("Invalid credentials");
    }

    // Update last login
    user.lastLogin = new Date();
    await user.save();

    logger.info(`User logged in: ${user.email}`);
    return user;
  }

  /**
   * Generate tokens for user
   */
  async generateTokens(user) {
    const accessToken = user.generateAccessToken();
    const refreshToken = user.generateRefreshToken();

    // Save refresh token
    await user.addRefreshToken(refreshToken);

    return { accessToken, refreshToken };
  }

  /**
   * Refresh user tokens
   */
  async refreshUserTokens(refreshToken) {
    const jwt = require("jsonwebtoken");

    try {
      // Verify refresh token
      const decoded = jwt.verify(
        refreshToken,
        process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET
      );

      // Find user and check if refresh token exists
      const user = await User.findById(decoded.id);
      if (
        !user ||
        !user.refreshTokens.some((rt) => rt.token === refreshToken)
      ) {
        throw new Error("Invalid refresh token");
      }

      if (!user.isActive) {
        throw new Error("Account is inactive");
      }

      // Generate new tokens
      const newAccessToken = user.generateAccessToken();
      const newRefreshToken = user.generateRefreshToken();

      // Remove old refresh token and add new one
      await user.removeRefreshToken(refreshToken);
      await user.addRefreshToken(newRefreshToken);

      return {
        accessToken: newAccessToken,
        refreshToken: newRefreshToken,
      };
    } catch (error) {
      throw new Error("Invalid or expired refresh token");
    }
  }

  /**
   * Get user profile by ID
   */
  async getUserProfile(userId) {
    const user = await User.findById(userId).populate(
      "assignedBusId",
      "busNumber routeId"
    );

    if (!user) {
      throw new Error("User not found");
    }

    return user;
  }

  /**
   * Update user profile
   */
  async updateUserProfile(userId, updateData) {
    const { firstName, lastName, phone } = updateData;

    const user = await User.findByIdAndUpdate(
      userId,
      { firstName, lastName, phone },
      { new: true, runValidators: true }
    );

    if (!user) {
      throw new Error("User not found");
    }

    logger.info(`User profile updated: ${user.email}`);
    return user;
  }

  /**
   * Change user password
   */
  async changeUserPassword(userId, currentPassword, newPassword) {
    // Get user with password
    const user = await User.findById(userId).select("+password");

    if (!user) {
      throw new Error("User not found");
    }

    // Check current password
    const isCurrentPasswordValid = await user.comparePassword(currentPassword);
    if (!isCurrentPasswordValid) {
      throw new Error("Current password is incorrect");
    }

    // Update password
    user.password = newPassword;
    await user.save();

    logger.info(`Password changed for user: ${user.email}`);
    return true;
  }

  /**
   * Logout user by removing refresh token
   */
  async logoutUser(user, refreshToken) {
    if (refreshToken) {
      await user.removeRefreshToken(refreshToken);
    }
    logger.info(`User logged out: ${user.email}`);
    return true;
  }

  /**
   * Get all users with filters (Admin function)
   */
  async getAllUsers(filters) {
    const { page = 1, limit = 20, role, isActive, search } = filters;

    const filter = {};
    if (role) filter.role = role;
    if (isActive !== undefined) filter.isActive = isActive === "true";

    if (search) {
      filter.$or = [
        { username: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
        { firstName: { $regex: search, $options: "i" } },
        { lastName: { $regex: search, $options: "i" } },
      ];
    }

    const users = await User.find(filter)
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
   * Get user by ID (Admin function)
   */
  async getUserById(userId) {
    const user = await User.findById(userId).populate(
      "assignedBusId",
      "busNumber routeId"
    );

    if (!user) {
      throw new Error("User not found");
    }

    return user;
  }

  /**
   * Update user by admin
   */
  async updateUserByAdmin(userId, updateData, adminUserId) {
    const { firstName, lastName, phone, role, assignedBusId, isActive } =
      updateData;

    const user = await User.findById(userId);
    if (!user) {
      throw new Error("User not found");
    }

    // Update user
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      {
        firstName,
        lastName,
        phone,
        role,
        assignedBusId,
        isActive,
      },
      { new: true, runValidators: true }
    );

    logger.info(`User updated by admin: ${updatedUser.email}`);
    return updatedUser;
  }

  /**
   * Delete user (Admin function)
   */
  async deleteUser(userId, adminUserId) {
    const user = await User.findById(userId);
    if (!user) {
      throw new Error("User not found");
    }

    // Prevent admin from deleting themselves
    if (user._id.toString() === adminUserId) {
      throw new Error("You cannot delete your own account");
    }

    await User.findByIdAndDelete(userId);
    logger.info(`User deleted by admin: ${user.email}`);
    return true;
  }

  /**
   * Get user statistics (Admin function)
   */
  async getUserStats() {
    const stats = await User.aggregate([
      {
        $group: {
          _id: "$role",
          count: { $sum: 1 },
          active: {
            $sum: { $cond: [{ $eq: ["$isActive", true] }, 1, 0] },
          },
          inactive: {
            $sum: { $cond: [{ $eq: ["$isActive", false] }, 1, 0] },
          },
        },
      },
    ]);

    const totalUsers = await User.countDocuments();
    const activeUsers = await User.countDocuments({ isActive: true });
    const inactiveUsers = await User.countDocuments({ isActive: false });

    return {
      totalUsers,
      activeUsers,
      inactiveUsers,
      roleStats: stats,
    };
  }
}

module.exports = new UserService();
