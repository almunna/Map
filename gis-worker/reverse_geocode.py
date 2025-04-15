#!/usr/bin/env python3
import sys
import json
import pandas as pd
import geopandas as gpd
import osmnx as ox
from shapely.geometry import Polygon
from tqdm import tqdm

if len(sys.argv) < 2:
    print(json.dumps({"error": "No input file provided"}))
    sys.exit(1)

input_file = sys.argv[1]

try:
    df = pd.read_csv(input_file)
except Exception as e:
    print(json.dumps({"error": f"Could not read CSV: {e}"}))
    sys.exit(1)

# Example: Assume the CSV has a column 'Boundary' which holds polygon coordinates.
polygons = []
for boundary in df['Boundary']:
    # Remove brackets and split by comma
    coordinates_str = boundary.replace('[', '').replace(']', '').split(',')
    coordinate_pairs = []
    i = 0
    while i < len(coordinates_str) - 1:
        try:
            x = float(coordinates_str[i].strip())
            y = float(coordinates_str[i+1].strip())
            coordinate_pairs.append((x, y))
            i += 2
        except:
            i += 1
    polygons.append(Polygon(coordinate_pairs) if coordinate_pairs else None)

df['polygon'] = polygons
gdf = gpd.GeoDataFrame(df, geometry=df['polygon'], crs="EPSG:4326")
gdf = gdf.to_crs(epsg=4326)

tags = {
    "building": True,
    "addr:housenumber": True,
    "addr:street": True,
    "addr:postcode": True,
    "addr:city": True
}

final_data = []

for _, row in tqdm(gdf.iterrows(), total=len(gdf)):
    minx, miny, maxx, maxy = row.geometry.bounds
    bbox = (minx, miny, maxx, maxy)
    try:
        gdf_osm = ox.features.features_from_bbox(bbox, tags)
        # Filter points and polygon features:
        gdf_points = gdf_osm[gdf_osm.geometry.type == "Point"]
        gdf_buildings = gdf_osm[gdf_osm.geometry.type == "Polygon"]

        # Spatial join to find which points/buildings fall within the row’s polygon
        points_inside = gpd.sjoin(
            gdf_points, gpd.GeoDataFrame(geometry=[row.geometry], crs="EPSG:4326"), predicate="within"
        )
        buildings_inside = gpd.sjoin(
            gdf_buildings, gpd.GeoDataFrame(geometry=[row.geometry], crs="EPSG:4326"), predicate="within"
        )

        for _, point in points_inside.iterrows():
            final_data.append({
                "lat": point.geometry.y,
                "lon": point.geometry.x,
                "address": (point.get("addr:housenumber", "N/A") + " " + point.get("addr:street", "")).strip()
                # other fields from row can be added if needed
            })

        for _, building in buildings_inside.iterrows():
            centroid = building.geometry.centroid
            final_data.append({
                "lat": centroid.y,
                "lon": centroid.x,
                "address": (building.get("addr:housenumber", "N/A") + " " + building.get("addr:street", "")).strip()
            })
    except Exception as e:
        print(f"Error processing polygon {row.name}: {e}")
        continue

# Convert result to DataFrame if needed
result_df = pd.DataFrame(final_data)
# Optionally save to CSV
result_df.to_csv("osm_addresses.csv", index=False)
print(json.dumps({"data": final_data}))
