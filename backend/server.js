import express from "express";
import mongoose from "mongoose";
import dotenv from "dotenv";
import cors from "cors";
import cookieParser from "cookie-parser";
import morgan from "morgan";
import gisProcessRowsRouter from "./controller/gisMap.js";
import employeeRouter from "./Router/router.js";
import gisRouter from "./controller/gis.js";
import reverseGeocodeRouter from "./controller/reverseGeocode.js";


// ————————————————————————————————————————————————————————————————————
// Catch truly uncaught errors so the process doesn't silently exit
process.on("uncaughtException", (err) => {
  console.error("🛑 Uncaught exception:", err);
});
process.on("unhandledRejection", (reason) => {
  console.error("🛑 Unhandled promise rejection:", reason);
});
// ————————————————————————————————————————————————————————————————————

dotenv.config();

const app = express();
const PORT         = process.env.PORT        || 8000;
const MONGO_URI    = process.env.MONGO_URI;
const FRONTEND_URL = process.env.FRONTEND_URL;

app.use(express.json());
app.use(cookieParser());
app.use(morgan("dev"));
app.use(
  cors({
    origin:      FRONTEND_URL,
    credentials: true,
  })
);

// — Database Connection
mongoose
  .connect(MONGO_URI)
  .then(() => console.log("✅ MongoDB Connected"))
  .catch((err) => console.error("❌ MongoDB Connection Failed:", err));

// — API Routes
app.use("/api/employees", employeeRouter);
app.use("/api/gis",  gisRouter);
app.use("/api/gis/process-rows", gisProcessRowsRouter);
app.use("/api/reverse-geocode", reverseGeocodeRouter);

// — Global Error Handler
// (this must come *after* all app.use(...) calls)
app.use((err, req, res, next) => {
  console.error("⚠️  Unhandled route error:", err);
  res.status(500).json({ error: err.message || "Internal server error" });
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
