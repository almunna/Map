import express from "express";
import multer from "multer";
import { spawn } from "child_process";
import path from "path";
import fs from "fs";

const router = express.Router();
const upload = multer({ dest: "uploads/" });

/* BULK CSV PROCESSING
   This route accepts the full CSV upload,
   then calls a Python script (reverse_geocode.py) that
   processes the CSV and outputs the processed data as JSON.
*/
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

/* SINGLE ROW PROCESSING
   This route receives a JSON object in the body under "row".
   It creates a temporary CSV containing that one row, calls a
   Python script (single_row_map.py) that processes the row and
   returns the map information (e.g. a base64 string).
*/
router.post("/process-row", (req, res) => {
  const rowData = req.body.row;
  if (!rowData || !rowData.Latitude || !rowData.Longitude) {
    return res.status(400).json({
      error: "Invalid or missing row data. Expecting Latitude and Longitude."
    });
  }

  // Create a temporary CSV file for the selected row.
  const singleRowFile = path.join("uploads", `single_row_${Date.now()}.csv`);
  // Adjust headers as needed; here we only send Latitude and Longitude.
  const csvContent = ["Latitude,Longitude", `${rowData.Latitude},${rowData.Longitude}`].join("\n");

  try {
    fs.writeFileSync(singleRowFile, csvContent, "utf8");
  } catch (err) {
    console.error("Error writing temporary CSV:", err);
    return res.status(500).json({ error: "Failed to write temporary CSV file." });
  }

  const pythonScript = path.join(process.cwd(), "controller", "single_row_map.py");
  const pythonProcess = spawn("python", [pythonScript, singleRowFile]);

  let scriptOutput = "";
  let scriptError = "";

  pythonProcess.stdout.on("data", (data) => {
    scriptOutput += data.toString();
  });

  pythonProcess.stderr.on("data", (data) => {
    scriptError += data.toString();
  });

  pythonProcess.on("close", (code) => {
    fs.unlink(singleRowFile, (unlinkErr) => {
      if (unlinkErr) console.error("Error deleting temporary CSV:", unlinkErr);
    });

    if (code !== 0) {
      console.error("Python script error (single row):", scriptError);
      return res.status(500).json({ error: "Single-row processing failed", details: scriptError });
    }
    try {
      const parsedOutput = JSON.parse(scriptOutput);
      res.status(200).json(parsedOutput); // e.g., { map: "<base64-string>" }
    } catch (err) {
      console.error("Error parsing Python script output (single row):", err);
      res.status(500).json({
        error: "Failed to parse Python output",
        details: err.message
      });
    }
  });
});

export default router;
