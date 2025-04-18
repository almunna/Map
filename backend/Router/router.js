// Router/router.js
import express from "express";
import userController from "../controller/user.controller.js";
import authController from "../controller/auth.controller.js";
import adminController from "../controller/admin.controller.js";

const router = express.Router();

// Auth endpoints
router.post("/register", userController.registerUser);
router.post("/login", userController.loginUser);
router.post("/forgot-password", authController.sendOTP);
router.post("/reset-password", authController.resetPassword);
router.get("/users", adminController.getAllUsers);
router.patch("/users/:userId/verify", adminController.verifyUser);
router.delete("/users/:userId", adminController.deleteUser);



export default router;

