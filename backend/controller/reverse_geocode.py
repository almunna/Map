#!/usr/bin/env python3
import sys
import json
import logging
import argparse

import pandas as pd
import geopandas as gpd
import osmnx as ox
from shapely.geometry import Polygon
from tqdm import tqdm

# ————————————————————————————————————————————————————————————————————
logging.basicConfig(
    stream=sys.stderr,
    level=logging.INFO,
    format="%(asctime)s %(levelname)s: %(message)s"
)



def safe_str(val):
    if val is None or (isinstance(val, float) and pd.isna(val)):
        return ""
    return str(val)

def parse_boundary(boundary):
    """Parse '[x1,y1],[x2,y2],…' into a Polygon, or None."""
    if not isinstance(boundary, str):
        return None
    tokens = boundary.replace('[', '').replace(']', '').split(',')
    coords, i = [], 0
    while i < len(tokens) - 1:
        try:
            x = float(tokens[i].strip())
            y = float(tokens[i + 1].strip())
            coords.append((x, y))
            i += 2
        except ValueError:
            i += 1
    return Polygon(coords) if len(coords) >= 3 else None

def load_df(path):
    """Read CSV, log columns, exit on failure."""
    try:
        df = pd.read_csv(path)
    except Exception as e:
        logging.error("Could not read CSV '%s': %s", path, e)
        print(json.dumps({"error": f"Could not read CSV: {e}"}))
        sys.exit(1)
    logging.info("Input columns: %s", df.columns.tolist())
    return df

def extract_address_fields(row):
    house = safe_str(getattr(row, "addr:housenumber", ""))
    street = safe_str(getattr(row, "addr:street", ""))
    name = safe_str(getattr(row, "name", ""))
    shop = safe_str(getattr(row, "shop", ""))
    amenity = safe_str(getattr(row, "amenity", ""))
    address = (house + " " + street).strip() or name or shop or amenity or "Unnamed Location"
    return {
        "address": address,
        "postcode": safe_str(getattr(row, "addr:postcode", "")),
        "city": safe_str(getattr(row, "addr:city", ""))
    }

def extract_addresses(df, buffer_deg):
    df["parsed"] = df["Boundary"].map(parse_boundary)
    df = df[df["parsed"].notnull()].reset_index(drop=True)
    if df.empty:
        logging.warning("No valid polygons after parsing.")
    gdf = gpd.GeoDataFrame(df, geometry="parsed", crs="EPSG:4326")

    tags = {
        "building": True,
        "addr:housenumber": True,
        "addr:street": True,
        "addr:postcode": True,
        "addr:city": True,
        "name": True,
        "shop": True,
        "amenity": True
    }

    results = []
    for row in tqdm(gdf.itertuples(index=False), total=len(gdf),
                    desc="Processing polygons", file=sys.stderr):
        poly = row.parsed
        d_value = getattr(row, "Number", "")
        buffered = poly.buffer(buffer_deg)
        minx, miny, maxx, maxy = buffered.bounds

        try:
            osm = ox.features.features_from_bbox((minx, miny, maxx, maxy), tags)
        except Exception as e:
            logging.warning("OSM fetch failed for row: %s", e)
            continue

        if osm.empty:
            logging.info("No OSM features found in bbox for row.")
            continue

        pts = osm[osm.geometry.type == "Point"]
        polys = osm[osm.geometry.type == "Polygon"]

        pts_in = pts[pts.geometry.within(poly)]
        polys_in = polys[polys.geometry.within(poly)]

        if pts_in.empty and not pts.empty:
            pts_in = pts[pts.geometry.within(buffered)]
        if polys_in.empty and not polys.empty:
            polys_in = polys[polys.geometry.within(buffered)]

        for pt in pts_in.itertuples():
            fields = extract_address_fields(pt)
            results.append({
                "lat": pt.geometry.y,
                "lon": pt.geometry.x,
                **fields,
                "d": d_value
            })

        for bd in polys_in.itertuples():
            cent = bd.geometry.centroid
            fields = extract_address_fields(bd)
            results.append({
                "lat": cent.y,
                "lon": cent.x,
                **fields,
                "d": d_value
            })

    logging.info("Processed %d polygons, found %d addresses", len(gdf), len(results))
    return results

def main():
    # For Colab compatibility: manual argument injection
    if "google.colab" in sys.modules:
        args = argparse.Namespace(input_file=input_file, buffer=0.0001)
    else:
        p = argparse.ArgumentParser(description="Reverse‑geocode CSV polygons")
        p.add_argument("input_file", help="CSV with a 'Boundary' column")
        p.add_argument(
            "--buffer",
            type=float,
            default=0.0001,
            help="Degrees to expand bbox when querying OSM (default: 0.0001)"
        )
        args = p.parse_args()

    df = load_df(args.input_file)
    addresses = extract_addresses(df, args.buffer)

    output = {"data": addresses}
    if not addresses:
        output["warning"] = "No addresses found; check your boundaries or increase --buffer."

    print(json.dumps(output, indent=2))

if __name__ == "__main__":
    main()
