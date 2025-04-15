#!/usr/bin/env python3
import sys
import pandas as pd
import geopandas as gpd
import matplotlib.pyplot as plt
import contextily as ctx
from shapely.geometry import Point
import base64
import io
import json

if len(sys.argv) < 2:
    print(json.dumps({"error": "Usage: single_row_map.py <single_row.csv>"}))
    sys.exit(1)

csv_path = sys.argv[1]

# Read the single-row CSV
df = pd.read_csv(csv_path)
# Check for valid data (adjust column names as needed)
if df.isnull().any().any():
    print(json.dumps({"error": "Selected row does not contain valid Latitude or Longitude"}))
    sys.exit(1)

# Create a geometry column from Longitude and Latitude
df["geometry"] = df.apply(lambda row: Point(row["Longitude"], row["Latitude"]), axis=1)
gdf = gpd.GeoDataFrame(df, geometry="geometry", crs="EPSG:4326")
# Convert to Web Mercator for contextily
gdf = gdf.to_crs(epsg=3857)

# Plot the map
fig, ax = plt.subplots(figsize=(10, 10))
gdf.plot(ax=ax, marker="o", color="red", markersize=100)
ctx.add_basemap(ax)
ax.set_title("Map for Selected Row")

# Save plot to in-memory buffer
buf = io.BytesIO()
plt.savefig(buf, format="png", dpi=300, bbox_inches='tight', pad_inches=0.1)
plt.close(fig)
buf.seek(0)

# Encode the image to Base64
encoded = base64.b64encode(buf.read()).decode("utf-8")
print(json.dumps({"map": encoded}))
