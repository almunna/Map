#!/usr/bin/env python3
import sys
import json
from geopy.geocoders import Nominatim
from geopy.exc import GeocoderTimedOut, GeocoderUnavailable

def reverse_geocode(lat, lon):
    geolocator = Nominatim(user_agent="gis_reverse_geocode_app")

    try:
        location = geolocator.reverse((lat, lon), exactly_one=True, addressdetails=True, timeout=5)
        if location and location.address:
            return {
                "address": location.address
            }
    except (GeocoderTimedOut, GeocoderUnavailable) as e:
        return {"error": "Geocoding service unavailable or timed out", "details": str(e)}
    except Exception as e:
        return {"error": "Unexpected error", "details": str(e)}

    return {"address": "N/A"}

if __name__ == "__main__":
    if len(sys.argv) != 3:
        print(json.dumps({"error": "lat and lon required"}))
        sys.exit(1)

    lat, lon = sys.argv[1], sys.argv[2]
    result = reverse_geocode(lat, lon)
    print(json.dumps(result))
