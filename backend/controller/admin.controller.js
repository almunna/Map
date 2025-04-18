import UserModel from "../Models/user.model.js";

/**
 * Get all users for admin panel.
 * Fields: name, email, congregation, referralSource, createdAt, verify_email
 */
const getAllUsers = async (req, res) => {
  try {
    const users = await UserModel.find(
      {},
      "name email congregation referralSource createdAt verify_email"
    ).sort({ createdAt: -1 });

    res.status(200).json({ users });
  } catch (err) {
    console.error("Get Users Error:", err);
    res.status(500).json({ message: "Failed to fetch users", error: true });
  }
};

/**
 * Verify (approve) a user by setting verify_email = true
 */
const verifyUser = async (req, res) => {
  const { userId } = req.params;

  try {
    const user = await UserModel.findByIdAndUpdate(
      userId,
      { verify_email: true },
      { new: true } // Return the updated user document
    );

    if (!user) {
      return res.status(404).json({ message: "User not found", success: false });
    }

    return res.status(200).json({
      message: "User verified successfully",
      success: true,
      user,
    });
  } catch (err) {
    console.error("Verification Error:", err);
    return res.status(500).json({
      message: "Failed to verify user",
      success: false,
    });
  }
};

/**
 * Delete user by ID
 */
const deleteUser = async (req, res) => {
  const { userId } = req.params;
  try {
    await UserModel.findByIdAndDelete(userId);
    res.status(200).json({ message: "User deleted successfully" });
  } catch (err) {
    console.error("Delete User Error:", err);
    res.status(500).json({ message: "Failed to delete user" });
  }
};

export default {
  getAllUsers,
  verifyUser,
  deleteUser,
};
