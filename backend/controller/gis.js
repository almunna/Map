import express from "express";
import multer from "multer";
import { spawn } from "child_process";
import path from "path";
import fs from "fs";

const router = express.Router();
const upload = multer({ dest: "uploads/" });


router.post("/", upload.single("file"), (req, res) => {
  const csvFilePath = req.file?.path;
  if (!csvFilePath) {
    return res.status(400).json({ error: "No CSV file uploaded." });
  }

  // Build the path to your Python script for bulk processing.
  const pythonScript = path.join(process.cwd(), "controller", "reverse_geocode.py");

  // Spawn a Python process to process the full CSV.
  const pythonProcess = spawn("python", [pythonScript, csvFilePath]);

  let scriptOutput = "";
  let scriptError = "";

  pythonProcess.stdout.on("data", (data) => {
    scriptOutput += data.toString();
  });

  pythonProcess.stderr.on("data", (data) => {
    scriptError += data.toString();
  });

  pythonProcess.on("close", (code) => {
    // Clean up the uploaded CSV file after processing.
    fs.unlink(csvFilePath, (err) => {
      if (err) console.error("Error deleting uploaded CSV:", err);
    });

    if (code !== 0) {
      console.error("Python script error (bulk processing):", scriptError);
      return res.status(500).json({ error: "CSV processing failed", details: scriptError });
    }
    try {
      // Expect the Python script to output a JSON string such as:
      // { "data": [ { "Latitude": "...", "Longitude": "...", ... }, ... ] }
      const parsedOutput = JSON.parse(scriptOutput);
      res.status(200).json(parsedOutput);
    } catch (err) {
      console.error("Error parsing Python output (bulk processing):", err);
      res.status(500).json({ error: "Failed to parse Python output", details: err.message });
    }
  });
});


router.post("/process-rows", async (req, res) => {
  const rows = req.body.rows;

  if (!Array.isArray(rows) || rows.length === 0) {
    return res.status(400).json({
      error: "Invalid input. 'rows' must be a non-empty array."
    });
  }

  try {
    // Extract only lat/lon from each row for Leaflet rendering
    const points = rows.map((row) => ({
      lat: parseFloat(row.lat),
      lon: parseFloat(row.lon),
      address: row.address || "",
      postcode: row.postcode || "",
      city: row.city || ""
    })).filter(p => !isNaN(p.lat) && !isNaN(p.lon));

    if (points.length === 0) {
      return res.status(400).json({ error: "No valid lat/lon found in the selected rows." });
    }

    // Return directly as JSON for Leaflet (no Python/image call)
    return res.status(200).json({ points });
  } catch (err) {
    console.error("Error processing multi-row data:", err);
    return res.status(500).json({ error: "Failed to extract coordinates", details: err.message });
  }
});



export default router;