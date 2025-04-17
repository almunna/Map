import express from "express";
import mongoose from "mongoose";
import dotenv from "dotenv";
import cors from "cors";
import cookieParser from "cookie-parser";
import morgan from "morgan";

import employeeRouter from "./Router/router.js"; // Auth routes
import gisRouter from "./controller/gis.js";     // GIS routes

dotenv.config(); // Load environment variables

const app = express();

// ✅ Environment Variables
const PORT = process.env.PORT || 8000;
const MONGO_URI = process.env.MONGO_URI;
const FRONTEND_URL = process.env.FRONTEND_URL; // e.g., https://map-3-9uk3.onrender.com

// ✅ Middleware
app.use(express.json());
app.use(cookieParser());
app.use(morgan("dev"));

// ✅ CORS Setup
app.use(
  cors({
    origin: FRONTEND_URL,
    credentials: true,
  })
);

// ✅ Database Connection
mongoose
  .connect(MONGO_URI)
  .then(() => console.log("✅ MongoDB Connected"))
  .catch((err) => console.error("❌ MongoDB Connection Failed:", err));

// ✅ API Routes
app.use("/api/employees", employeeRouter);
app.use("/api/gis", gisRouter);

// ✅ Start Server
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
