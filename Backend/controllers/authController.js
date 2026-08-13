import jwt from "jsonwebtoken";
import User from "../models/User.js";
import { OAuth2Client } from "google-auth-library";

// Generate JWT token
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: "6h" });
};
const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
/**
 * @route  POST /api/auth/register
 * @desc   Register a new user
 * @access Public
 */
export const register = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    // Validation
    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: "All fields (name, email, password) are required.",
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: "Password must be at least 6 characters.",
      });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: "User with this email already exists.",
      });
    }

    // Create user (password hashed via pre-save hook)
    const user = await User.create({ name, email, password });

    const token = generateToken(user._id);

    res.status(201).json({
      success: true,
      message: "Account created successfully!",
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
      },
    });
  } catch (error) {
    console.error("Register error:", error);

    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: "Email already registered.",
      });
    }

    res.status(500).json({
      success: false,
      message: "Registration failed. Please try again.",
    });
  }
};

/**
 * @route  POST /api/auth/login
 * @desc   Login user and return JWT
 * @access Public
 */
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validation
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and password are required.",
      });
    }

    // Find user
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password.",
      });
    }

    // Verify password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password.",
      });
    }

    const token = generateToken(user._id);

    res.json({
      success: true,
      message: "Login successful!",
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        avatar: user.avatar || "",
      },
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({
      success: false,
      message: "Login failed. Please try again.",
    });
  }
};

export const googleLogin = async (req, res) => {
  try {
    const { credential } = req.body;

    if (!credential) {
      return res.status(400).json({
        success: false,
        message: "Google credential missing",
      });
    }

    const ticket = await googleClient.verifyIdToken({
      idToken: credential,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();

    const { email, name, picture } = payload;

    let user = await User.findOne({
      email: email.toLowerCase(),
    });

    // Create user if it doesn't exist
    if (!user) {
      user = await User.create({
        name,
        email,
        avatar: picture,
        isGoogleUser: true,
      });
    } else {
      // Existing Google user:
      // - If avatar is missing, set it to the latest Google picture.
      // - If avatar exists, keep it unless a newer Google picture is available.
      if (!user.avatar && picture) {
        user.avatar = picture;
        await user.save();
      } else if (picture && picture !== user.avatar) {
        // Keep existing unless Google provides a different picture URL.
        user.avatar = picture;
        await user.save();
      }
    }

    const token = generateToken(user._id);

    res.json({
      success: true,
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        avatar: user.avatar || picture || "",
      },
    });
  } catch (error) {
    console.error("Google Login Error:", error);

    res.status(500).json({
      success: false,
      message: "Google login failed",
    });
  }
};
