import express from "express";
import { spawn } from "child_process";
import path from "path";

const router = express.Router();

router.post("/", async (req, res) => {
  const { lat, lon } = req.body;

  if (typeof lat !== "number" || typeof lon !== "number") {
    return res.status(400).json({ error: "lat and lon must be numbers" });
  }

  const pythonScript = path.join(process.cwd(), "controller", "reverse_geocode_point.py");

  const process = spawn("python", [pythonScript, lat.toString(), lon.toString()]);

  let output = "";
  let error = "";

  process.stdout.on("data", (data) => (output += data.toString()));
  process.stderr.on("data", (data) => (error += data.toString()));

  process.on("close", (code) => {
    if (code !== 0 || error) {
      return res.status(500).json({ error: "Reverse geocoding failed", details: error });
    }

    try {
      const result = JSON.parse(output);
      return res.status(200).json(result);
    } catch (e) {
      return res.status(500).json({ error: "Invalid JSON returned", raw: output });
    }
  });
});

export default router;
