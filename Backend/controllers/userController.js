import path from "path";
import fs from "fs/promises";
import bcrypt from "bcryptjs";

import User from "../models/User.js";
import {
  updateUserProfile,
  changeUserPassword,
  deleteUserEverything,
} from "../services/userService.js";

const uploadsDir = path.join(process.cwd(), "uploads");
const vectorstoreBaseDir = path.join(process.cwd(), "vectorstore");

export const updateProfile = async (req, res) => {
  try {
    const userId = req.user?._id || req.user?.id;
    const { name } = req.body;

    // Email must be read-only
    if (req.body?.email) {
      delete req.body.email;
    }

    // Avatar upload is handled by multer in routes.
    // Store a URL path that the frontend can access via static /uploads.
    const avatarPath = req.file?.filename
      ? `/uploads/${req.file.filename}`
      : req.body?.avatarPath || "";

    const updatedUser = await updateUserProfile({
      userId,
      name,
      avatarPath: avatarPath ? avatarPath : undefined,
    });

    if (!updatedUser) {
      return res.status(404).json({
        success: false,
        message: "User not found.",
      });
    }

    res.json({
      success: true,
      message: "Profile updated successfully!",
      user: updatedUser,
    });
  } catch (err) {
    console.error("updateProfile error:", err);
    res.status(500).json({
      success: false,
      message: err.message || "Failed to update profile.",
    });
  }
};

export const changePassword = async (req, res) => {
  try {
    const userId = req.user?._id || req.user?.id;
    const { currentPassword, newPassword, confirmPassword } = req.body;

    if (!currentPassword) {
      return res.status(400).json({
        success: false,
        message: "Current password is required.",
      });
    }

    if (!newPassword || newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: "New password must be at least 6 characters.",
      });
    }

    if (newPassword !== confirmPassword) {
      return res.status(400).json({
        success: false,
        message: "New password and confirm password must match.",
      });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found.",
      });
    }

    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      return res.status(400).json({
        success: false,
        message: "Current password is incorrect.",
      });
    }

    user.password = newPassword;
    await user.save();

    return res.json({
      success: true,
      message: "Password updated successfully!",
    });
  } catch (err) {
    console.error("changePassword error:", err);
    res.status(500).json({
      success: false,
      message: err.message || "Failed to update password.",
    });
  }
};

export const deleteAccount = async (req, res) => {
  try {
    const userId = req.user?._id || req.user?.id;
    const { passwordConfirmation } = req.body;

    if (!passwordConfirmation) {
      return res.status(400).json({
        success: false,
        message: "Password confirmation is required.",
      });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found.",
      });
    }

    const isMatch = await user.comparePassword(passwordConfirmation);
    if (!isMatch) {
      return res.status(400).json({
        success: false,
        message: "Password confirmation is incorrect.",
      });
    }

    await deleteUserEverything({
      userId,
      uploadsBasePath: uploadsDir,
      vectorstoreBasePath: vectorstoreBaseDir,
    });

    return res.json({
      success: true,
      message: "Account deleted successfully!",
    });
  } catch (err) {
    console.error("deleteAccount error:", err);
    res.status(500).json({
      success: false,
      message: err.message || "Failed to delete account.",
    });
  }
};
