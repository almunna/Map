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

  const pythonScript = path.join(process.cwd(), "controller", "reverse_geocode.py");

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
    fs.unlink(csvFilePath, (err) => {
      if (err) console.error("Error deleting uploaded CSV:", err);
    });

    if (code !== 0) {
      console.error("Python script error (bulk processing):", scriptError);
      return res.status(500).json({ error: "CSV processing failed", details: scriptError });
    }
    try {
      const parsedOutput = JSON.parse(scriptOutput);
      res.status(200).json(parsedOutput);
    } catch (err) {
      console.error("Error parsing Python output (bulk processing):", err);
      res.status(500).json({ error: "Failed to parse Python output", details: err.message });
    }
  });
});

export default router;
