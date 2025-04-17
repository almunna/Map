import bcrypt from "bcrypt";

import UserModel from "../Models/user.model.js";

const registerUser = async (req, res) => {
  try {
    const { name, email, password, status, congregation, referralSource } = req.body;

    // Validate input fields
    if (!name || !email || !password) {
      return res.status(400).json({
        message: "Please provide name, email, and password",
        error: true,
        success: false,
      });
    }

    // ✅ Password length check
    if (password.length < 8) {
      return res.status(400).json({
        message: "Password must be at least 8 characters long",
        error: true,
        success: false,
      });
    }

    // Validate email format
    const emailRegex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,6}$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        message: "Invalid email format",
        error: true,
        success: false,
      });
    }

    // Check if the user already exists
    const user = await UserModel.findOne({ email });
    if (user) {
      return res.status(400).json({
        message: "Email already registered",
        error: true,
        success: false,
      });
    }

    // Hash the password
    const salt = await bcrypt.genSalt(10);
    const hashPassword = await bcrypt.hash(password, salt);

    // Create new user payload
    const payload = {
      name,
      email,
      password: hashPassword,
      status,
      congregation,
      referralSource,
    };

    // Create a new user
    const newUser = new UserModel(payload);
    const save = await newUser.save();

    // Send success response
    return res.status(201).json({
      message: "User registered successfully",
      success: true,
      user: save,
    });
  } catch (error) {
    console.error(error); // Log error for debugging
    return res.status(500).json({
      message: error.message || "An unexpected error occurred",
      error: true,
      success: false,
    });
  }
};




const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await UserModel.findOne({ email });

    if (!user) {
      return res.status(400).json({
        message: "User not registered",
        error: true,
        success: false,
      });
    }

    const checkPassword = await bcrypt.compare(password, user.password);
    if (!checkPassword) {
      return res.status(400).json({
        message: "Incorrect password",
        error: true,
        success: false,
      });
    }

    // Block unverified users unless ADMIN
    if (!user.verify_email && user.role !== "ADMIN") {
      return res.status(403).json({
        message: "Your account is not approved by admin yet.",
        error: true,
        success: false,
      });
    }

    return res.status(200).json({
      message: "Login successfully",
      error: false,
      success: true,
      user: {
        name: user.name,
        email: user.email,
        role: user.role,
      },
      token: "dummy-token", // Replace with JWT if needed
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      message: error.message || "User credential is invalid",
      error: true,
      success: false,
    });
  }
};

export default {registerUser, loginUser};
