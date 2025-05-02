import React, { useEffect, useRef, useState } from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  useMap,
  useMapEvents,
} from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import domtoimage from "dom-to-image";

// Fix Leaflet marker icons
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
});

const AutoZoom = ({ points = [] }) => {
  const map = useMap();
  useEffect(() => {
    if (points.length > 0) {
      const bounds = L.latLngBounds(points.map((p) => [p.lat, p.lon]));
      map.fitBounds(bounds, { padding: [50, 50] });
    }
  }, [points, map]);
  return null;
};

// Marker for clicked reverse-geocode
const ClickMarker = ({ position, info }) => {
  return position ? (
    <Marker position={position}>
      <Popup>
        <strong>Reverse-Geocoded Address:</strong><br />
        {info?.address || "N/A"}
      </Popup>
    </Marker>
  ) : null;
};

const GISMap = ({ mapPoints = [] }) => {
  const [clickedPosition, setClickedPosition] = useState(null);
  const [clickedInfo, setClickedInfo] = useState({});
  const [addressCache, setAddressCache] = useState({}); // store fetched addresses
  const mapRef = useRef();

  const MapClickHandler = () => {
    useMapEvents({
      click: async (e) => {
        const { lat, lng } = e.latlng;
        setClickedPosition([lat, lng]);

        try {
          const response = await fetch("http://geocode-na1k.onrender.com/api/reverse-geocode", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ lat, lon: lng }),
          });
          const data = await response.json();
          setClickedInfo(data);
        } catch (err) {
          console.error("Reverse geocoding error:", err);
          setClickedInfo({ address: "N/A" });
        }
      },
    });
    return null;
  };

  const handleDownloadMap = () => {
    if (!mapRef.current) return alert("Map not available.");
    domtoimage
      .toPng(mapRef.current)
      .then((dataUrl) => {
        const link = document.createElement("a");
        link.download = "map.png";
        link.href = dataUrl;
        link.click();
      })
      .catch((err) => {
        console.error("Map download error:", err);
        alert("Failed to download map.");
      });
  };

  // 👇 Helper: Fetch address on demand + cache
  const getAddress = async (lat, lon, key) => {
    if (addressCache[key]) return;

    try {
      const response = await fetch("http://geocode-na1k.onrender.com/api/reverse-geocode", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lat, lon }),
      });
      const data = await response.json();
      setAddressCache((prev) => ({
        ...prev,
        [key]: data.address || "N/A",
      }));
    } catch {
      setAddressCache((prev) => ({
        ...prev,
        [key]: "N/A",
      }));
    }
  };

  return (
    <div className="mt-6">


      <div className="bg-white" ref={mapRef}>
        <h4 className="text-md font-semibold mb-2">Map Preview</h4>
        <MapContainer
          style={{ height: "500px", width: "100%" }}
          center={[38.6, -90.4]}
          zoom={9}
          scrollWheelZoom={true}
        >
          <TileLayer
            attribution='&copy; OpenStreetMap contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          <AutoZoom points={mapPoints} />
          <MapClickHandler />
          <ClickMarker position={clickedPosition} info={clickedInfo} />

          {mapPoints.map((loc, idx) => {
            const key = `${loc.lat},${loc.lon}`;
            const address = addressCache[key];

            return (
              <Marker key={idx} position={[loc.lat, loc.lon]}>
                <Popup
                  eventHandlers={{
                    add: () => getAddress(loc.lat, loc.lon, key),
                  }}
                >
                  <strong>Address:</strong><br />
                  {address || "Loading..."}
                </Popup>
              </Marker>
            );
          })}
        </MapContainer>
      </div>
    </div>
  );
};

export default GISMap;
