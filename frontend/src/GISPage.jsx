import React, { useState, useRef, useEffect } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
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

const AutoZoom = ({ points }) => {
  const map = useMap();
  useEffect(() => {
    if (points.length > 0) {
      const bounds = L.latLngBounds(points.map((p) => [p.lat, p.lon]));
      map.fitBounds(bounds, { padding: [50, 50] });
    }
  }, [points, map]);
  return null;
};

const GISPage = () => {
  const [selectedFile, setSelectedFile] = useState(null);
  const [groupedData, setGroupedData] = useState({});
  const [dGroups, setDGroups] = useState([]);
  const [currentPage, setCurrentPage] = useState(0);
  const [processing, setProcessing] = useState(false);
  const [resultsReady, setResultsReady] = useState(false);
  const [selectedRows, setSelectedRows] = useState([]);
  const [mapPoints, setMapPoints] = useState([]);
  const mapRef = useRef();

  const handleFileChange = (e) => setSelectedFile(e.target.files[0]);

  const handleStart = async () => {
    if (!selectedFile) return alert("Please upload a CSV first.");
    const formData = new FormData();
    formData.append("file", selectedFile);
    setProcessing(true);

    try {
      const response = await fetch("http://localhost:8000/api/gis", {
        method: "POST",
        body: formData,
      });
      const json = await response.json();

      const grouped = {};
      json.data.forEach((row) => {
        const key = row.d || "undefined";
        if (!grouped[key]) grouped[key] = [];
        grouped[key].push(row);
      });

      setGroupedData(grouped);
      setDGroups(Object.keys(grouped));
      setResultsReady(true);
      setCurrentPage(0);
    } catch (err) {
      alert(err.message);
    } finally {
      setProcessing(false);
    }
  };

  const handleRowToggle = (key) => {
    setSelectedRows((prev) =>
      prev.includes(key) ? prev.filter((i) => i !== key) : [...prev, key]
    );
  };

  const handleSelectAll = () => {
    const keys = (groupedData[dGroups[currentPage]] || []).map((_, idx) => `${currentPage}-${idx}`);
    setSelectedRows(keys);
  };

  const handleSelectNone = () => {
    const keys = (groupedData[dGroups[currentPage]] || []).map((_, idx) => `${currentPage}-${idx}`);
    setSelectedRows((prev) => prev.filter((key) => !keys.includes(key)));
  };

  const getSelectedLocations = () => {
    return selectedRows.map((key) => {
      const [page, idx] = key.split("-").map(Number);
      const dVal = dGroups[page];
      return groupedData[dVal]?.[idx];
    }).filter(Boolean);
  };

  const handleDownloadMap = () => {
    const mapNode = mapRef.current;
    if (!mapNode) return alert("Map not found.");
    domtoimage
      .toPng(mapNode)
      .then((dataUrl) => {
        const link = document.createElement("a");
        link.download = "map.png";
        link.href = dataUrl;
        link.click();
      })
      .catch((err) => {
        console.error("Error generating map image:", err);
        alert("Failed to download map.");
      });
  };

  const goToPage = (page) => {
    setCurrentPage(page);
    setSelectedRows([]);
    setMapPoints([]);
  };

  useEffect(() => {
    const fetchPoints = async () => {
      if (selectedRows.length === 0) {
        setMapPoints([]);
        return;
      }

      const selectedData = getSelectedLocations();

      try {
        const response = await fetch("http://localhost:8000/api/gis/process-rows", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ rows: selectedData }),
        });

        const json = await response.json();
        if (json.points) setMapPoints(json.points);
      } catch (err) {
        console.error("Error fetching map points:", err);
      }
    };

    fetchPoints();
  }, [selectedRows]);

  const totalPages = dGroups.length;
  const currentDValue = dGroups[currentPage];
  const currentRows = groupedData[currentDValue] || [];

  return (
    <div className="bg-white max-w-[1000px] w-full rounded-[20px] border border-gray-300 min-h-[60vh] p-5">
      <h3 className="text-lg font-semibold text-gray-900 mb-5 text-center">GIS Data Table</h3>

      {!processing && !resultsReady && (
        <div className="flex max-w-[300px] flex-col gap-4 ml-auto mr-auto">
          <input
            type="file"
            accept=".csv"
            onChange={handleFileChange}
            className="border border-gray-300 rounded-md text-sm px-2 py-1"
          />
          <button
            onClick={handleStart}
            className="bg-blue-500 max-w-[200px] min-w-[150px] text-white py-2 rounded-md hover:bg-blue-600 ml-auto mr-auto"
          >
            Process CSV
          </button>
        </div>
      )}

      {processing && <div className="text-center text-sm text-gray-700">Processing...</div>}

      {resultsReady && currentRows.length > 0 && (
        <>
          <div className="flex items-center gap-4 mt-4 mb-2">
            <button
              onClick={handleSelectAll}
              className="bg-yellow-400 text-black px-4 py-2 rounded hover:bg-yellow-500"
            >
              Select All
            </button>
            <button
              onClick={handleSelectNone}
              className="bg-gray-300 text-black px-4 py-2 rounded hover:bg-gray-400"
            >
              Select None
            </button>
          </div>

          <table className="min-w-full text-sm border border-gray-300 rounded-md text-left mt-1">
            <thead className="bg-gray-100">
              <tr>
                <th className="p-2 border text-center">Select</th>
                {Object.keys(currentRows[0]).map((header, idx) => (
                  <th key={idx} className="p-2 border">{header === "d" ? "Number" : header}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {currentRows.map((row, rowIdx) => {
                const rowKey = `${currentPage}-${rowIdx}`;
                return (
                  <tr key={rowIdx} className="hover:bg-gray-50">
                    <td className="p-2 border text-center">
                      <input
                        type="checkbox"
                        checked={selectedRows.includes(rowKey)}
                        onChange={() => handleRowToggle(rowKey)}
                      />
                    </td>
                    {Object.values(row).map((val, idx) => (
                      <td key={idx} className="p-2 border">{val}</td>
                    ))}
                  </tr>
                );
              })}
            </tbody>
          </table>

          <div className="flex gap-2 justify-center mt-3">
            <button
              disabled={currentPage === 0}
              onClick={() => goToPage(Math.max(currentPage - 1, 0))}
              className="px-3 py-1 border rounded hover:bg-gray-100"
            >
              Previous
            </button>

            {(() => {
              const start = Math.max(0, Math.min(currentPage - 1, totalPages - 4));
              const end = Math.min(start + 4, totalPages);

              return dGroups.slice(start, end).map((group, index) => {
                const pageIndex = start + index;
                return (
                  <button
                    key={pageIndex}
                    onClick={() => goToPage(pageIndex)}
                    className={`px-3 py-1 border rounded ${
                      currentPage === pageIndex ? "bg-blue-500 text-white" : "hover:bg-gray-100"
                    }`}
                  >
                    {pageIndex + 1}
                  </button>
                );
              });
            })()}

            <button
              disabled={currentPage === totalPages - 1}
              onClick={() => goToPage(Math.min(currentPage + 1, totalPages - 1))}
              className="px-3 py-1 border rounded hover:bg-gray-100"
            >
              Next
            </button>
          </div>

          {selectedRows.length > 0 && (
            <button
              onClick={handleDownloadMap}
              className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 mt-10"
            >
              Download Map
            </button>
          )}

          <div className="mt-6" ref={mapRef}>
            <h4 className="text-md font-semibold mb-2">Map Preview</h4>
            <MapContainer
              style={{ height: "500px", width: "100%" }}
              center={[38.6, -90.4]}
              zoom={9}
              scrollWheelZoom={true}
            >
              <TileLayer
                attribution='&copy; <a href="https://osm.org/copyright">OpenStreetMap</a>'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              <AutoZoom points={mapPoints} />
              {mapPoints.map((loc, idx) => (
                <Marker key={idx} position={[parseFloat(loc.lat), parseFloat(loc.lon)]}>
                  <Popup>
                    {loc.address || "No address"}
                    <br />
                    {loc.city}, {loc.postcode}
                  </Popup>
                </Marker>
              ))}
            </MapContainer>
          </div>
        </>
      )}
    </div>
  );
};

export default GISPage;
