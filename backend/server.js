// server.js
import express from "express";
import mongoose from "mongoose";
import dotenv from "dotenv";
import cors from "cors";
import employeeRouter from "./Router/router.js"; // For auth endpoints
import gisRouter from "./controller/gis.js";         // For CSV processing
import cookieParser from "cookie-parser";
import morgan from "morgan";

dotenv.config();
const app = express();

app.use(express.json());
app.use(
  cors({
    credentials: true,
    origin: process.env.FRONTEND_URL,
  })
);
app.use(cookieParser());
app.use(morgan());

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("✅ MongoDB Connected"))
  .catch((err) => console.error("❌ MongoDB Connection Failed:", err));

// Routes mounting:
app.use("/api/employees", employeeRouter);
app.use("/api/gis", gisRouter);

const PORT = process.env.PORT || 8000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
