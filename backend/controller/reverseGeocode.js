import express from "express";
import { spawn } from "child_process";
import path from "path";

const router = express.Router();

router.post("/", (req, res) => {
  const { lat, lon } = req.body;

  if (!lat || !lon) {
    return res.status(400).json({ error: "lat and lon required" });
  }

  const pythonScript = path.join(process.cwd(), "controller", "reverse_geocode_point.py");

  const pythonProcess = spawn("python", [pythonScript, lat, lon]);

  let output = "";
  let error = "";

  pythonProcess.stdout.on("data", (data) => {
    output += data.toString();
  });

  pythonProcess.stderr.on("data", (data) => {
    error += data.toString();
  });

  pythonProcess.on("close", (code) => {
    if (code !== 0 || error) {
      return res.status(500).json({ error: "Python error", details: error });
    }
    try {
      const result = JSON.parse(output);
      res.json(result);
    } catch (err) {
      res.status(500).json({ error: "Parsing error", details: err.message });
    }
  });
});

export default router;
