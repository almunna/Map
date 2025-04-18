# #!/usr/bin/env python3
# import sys
# import pandas as pd
# import geopandas as gpd
# import matplotlib.pyplot as plt
# import contextily as ctx
# from shapely.geometry import Point
# import base64
# import io
# import json

# if len(sys.argv) < 2:
#     print(json.dumps({"error": "Usage: single_row_map.py <single_row.csv>"}))
#     sys.exit(1)

# csv_path = sys.argv[1]

# # Read the single-row CSV
# df = pd.read_csv(csv_path)
# # Check for valid data (adjust column names as needed)
# if df.isnull().any().any():
#     print(json.dumps({"error": "Selected row does not contain valid Latitude or Longitude"}))
#     sys.exit(1)

# # Create a geometry column from Longitude and Latitude
# df["geometry"] = df.apply(lambda row: Point(row["Longitude"], row["Latitude"]), axis=1)
# gdf = gpd.GeoDataFrame(df, geometry="geometry", crs="EPSG:4326")
# # Convert to Web Mercator for contextily
# gdf = gdf.to_crs(epsg=3857)

# # Plot the map
# fig, ax = plt.subplots(figsize=(10, 10))
# gdf.plot(ax=ax, marker="o", color="red", markersize=100)
# ctx.add_basemap(ax)
# ax.set_title("Map for Selected Row")

# # Save plot to in-memory buffer
# buf = io.BytesIO()
# plt.savefig(buf, format="png", dpi=300, bbox_inches='tight', pad_inches=0.1)
# plt.close(fig)
# buf.seek(0)

# # Encode the image to Base64
# encoded = base64.b64encode(buf.read()).decode("utf-8")
# print(json.dumps({"map": encoded}))
#!/usr/bin/env python3
import sys
import json
import io
import base64

import pandas as pd
import geopandas as gpd
import matplotlib.pyplot as plt
import contextily as ctx
from shapely.geometry import Point

def main():
    if len(sys.argv) < 2:
        print(json.dumps({"error": "Usage: single_row_map.py <rows.csv>"}))
        sys.exit(1)

    csv_path = sys.argv[1]
    try:
        df = pd.read_csv(csv_path)
    except Exception as e:
        print(json.dumps({"error": f"Could not read CSV: {e}"}))
        sys.exit(1)

    # Require Latitude and Longitude columns
    if "Latitude" not in df.columns or "Longitude" not in df.columns:
        print(json.dumps({"error": "CSV must contain 'Latitude' and 'Longitude' columns"}))
        sys.exit(1)

    # Drop any rows with missing coordinates
    df = df.dropna(subset=["Latitude", "Longitude"])
    if df.empty:
        print(json.dumps({"error": "No valid rows with Latitude and Longitude"}))
        sys.exit(1)

    # Build GeoDataFrame
    df["geometry"] = df.apply(lambda row: Point(row["Longitude"], row["Latitude"]), axis=1)
    gdf = gpd.GeoDataFrame(df, geometry="geometry", crs="EPSG:4326")
    gdf = gdf.to_crs(epsg=3857)

    # Plot all points
    fig, ax = plt.subplots(figsize=(10, 10))
    gdf.plot(ax=ax, marker="o", color="red", markersize=50)

    # Zoom to data bounds with a small margin
    minx, miny, maxx, maxy = gdf.total_bounds
    dx, dy = (maxx - minx) * 0.1, (maxy - miny) * 0.1
    ax.set_xlim(minx - dx, maxx + dx)
    ax.set_ylim(miny - dy, maxy + dy)

    # Add basemap
    ctx.add_basemap(ax)
    ax.set_axis_off()

    # Save to in-memory buffer
    buf = io.BytesIO()
    plt.savefig(buf, format="png", dpi=300, bbox_inches="tight", pad_inches=0.1)
    plt.close(fig)
    buf.seek(0)

    # Encode image to Base64 and output JSON
    encoded = base64.b64encode(buf.read()).decode("utf-8")
    print(json.dumps({"map": encoded}))

if __name__ == "__main__":
    main()
