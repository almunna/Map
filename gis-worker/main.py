from fastapi import FastAPI, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
import uvicorn
from reverse_geocode import process_csv
from single_row_map import generate_map_from_row
import json

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Replace with your Node app URL in production
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.post("/bulk-process")
async def bulk_process(file: UploadFile = File(...)):
    content = await file.read()
    return process_csv(content)  # You update this to parse bytes from uploaded CSV

@app.post("/single-row")
async def single_row(row: dict):
    return generate_map_from_row(row)

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
