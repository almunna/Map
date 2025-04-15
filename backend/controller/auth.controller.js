import crypto from "crypto";
import bcryptjs from 'bcryptjs';
import UserModel from "../Models/user.model.js";
import nodemailer from "nodemailer";

const sendOTP = async (req, res) => {
  const { email } = req.body;
  if (!email) {
    return res.status(400).json({ message: "Email is required", success: false });
  }

  const user = await UserModel.findOne({ email });
  if (!user) {
    return res.status(400).json({ message: "Email not registered", success: false });
  }

  // Generate 6-digit OTP
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  const expiry = new Date(Date.now() + 10 * 60 * 1000); // 10 mins

  user.forgot_password_otp = otp;
  user.forgot_password_expiry = expiry;
  await user.save();

  // Send email (use your email credentials)
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.SMTP_EMAIL,
      pass: process.env.SMTP_PASSWORD,
    },
  });

  const mailOptions = {
    from: process.env.SMTP_EMAIL,
    to: email,
    subject: "Your Password Reset OTP",
    text: `Use this OTP to reset your password: ${otp}`,
  };

  transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
      return res.status(500).json({ message: "Failed to send email", error: true });
    }
    res.status(200).json({ message: "OTP sent to email", success: true });
  });
};
const resetPassword = async (req, res) => {
    const { email, otp, newPassword } = req.body;
  
    if (!email || !otp || !newPassword) {
      return res.status(400).json({ message: "All fields are required", success: false });
    }
  
    const user = await UserModel.findOne({ email });
    if (!user || user.forgot_password_otp !== otp) {
      return res.status(400).json({ message: "Invalid OTP", success: false });
    }
  
    if (new Date() > new Date(user.forgot_password_expiry)) {
      return res.status(400).json({ message: "OTP expired", success: false });
    }
  
    const salt = await bcryptjs.genSalt(10);
    user.password = await bcryptjs.hash(newPassword, salt);
    user.forgot_password_otp = null;
    user.forgot_password_expiry = null;
    await user.save();
  
    return res.status(200).json({ message: "Password reset successfully", success: true });
  };
  
  export default {
    sendOTP,
    resetPassword,
  };