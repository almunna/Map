import React, { useState, useEffect } from "react";
import GISMap from "./GISMap";

const GISPage = () => {
  const [selectedFile, setSelectedFile] = useState(null);
  const [groupedData, setGroupedData] = useState({});
  const [dGroups, setDGroups] = useState([]);
  const [currentPage, setCurrentPage] = useState(0);
  const [processing, setProcessing] = useState(false);
  const [resultsReady, setResultsReady] = useState(false);
  const [selectedRows, setSelectedRows] = useState([]);
  const [mapPoints, setMapPoints] = useState([]);

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
    const keys = currentRows.map((_, idx) => `${currentPage}-${idx}`);
    setSelectedRows((prev) => [...new Set([...prev, ...keys])]);
  };

  const handleSelectNone = () => {
    const keys = currentRows.map((_, idx) => `${currentPage}-${idx}`);
    setSelectedRows((prev) => prev.filter((key) => !keys.includes(key)));
  };

  const getSelectedLocations = () => {
    return selectedRows
      .map((key) => {
        const [page, idx] = key.split("-").map(Number);
        const dVal = dGroups[page];
        return groupedData[dVal]?.[idx];
      })
      .filter(Boolean);
  };

  const goToPage = (page) => {
    setCurrentPage(page);
    setSelectedRows([]); // ✅ clears selected checkboxes when page changes
    setMapPoints([]);    // ✅ also clears map markers
  };

  useEffect(() => {
    const selectedData = getSelectedLocations();
    const points = selectedData
      .map((row) => {
        const lat = parseFloat(row.lat);
        const lon = parseFloat(row.lon);
        return !isNaN(lat) && !isNaN(lon) ? { lat, lon } : null;
      })
      .filter(Boolean);
    setMapPoints(points);
  }, [selectedRows]);

  const totalPages = dGroups.length;
  const currentDValue = dGroups[currentPage];
  const currentRows = groupedData[currentDValue] || [];

  const renderPageButtons = () => {
    const windowSize = 8;
    const buttons = [];
  
    let start = Math.max(0, currentPage - Math.floor(windowSize / 2));
    let end = start + windowSize;
  
    if (end > totalPages) {
      end = totalPages;
      start = Math.max(0, end - windowSize);
    }
  
    // Main window pages
    for (let i = start; i < end; i++) {
      buttons.push(
        <button
          key={i}
          onClick={() => goToPage(i)}
          className={`px-3 py-1 border rounded ${
            currentPage === i ? "bg-blue-500 text-white" : "hover:bg-gray-100"
          }`}
        >
          {i + 1}
        </button>
      );
    }
  
    // Add "..." if there's a gap before the last 2
    const lastPages = [totalPages - 2, totalPages - 1];
    if (totalPages > end + 1) {
      buttons.push(<span key="dots" className="px-2">...</span>);
    }
  
    // Show last 2 pages if not already visible
    lastPages.forEach((page) => {
      if (page >= end) {
        buttons.push(
          <button
            key={page}
            onClick={() => goToPage(page)}
            className={`px-3 py-1 border rounded ${
              currentPage === page ? "bg-blue-500 text-white" : "hover:bg-gray-100"
            }`}
          >
            {page + 1}
          </button>
        );
      }
    });
  
    return buttons;
  };
  

  return (
    <div className="bg-white max-w-[1000px] w-full rounded-[20px] border border-gray-300 min-h-[60vh] p-5">
      <h3 className="text-lg font-semibold text-gray-900 mb-5 text-center">
        GIS Data Table
      </h3>

      {!processing && !resultsReady && (
        <div className="flex flex-col gap-4 ml-auto mr-auto max-w-[300px]">
          <input
            type="file"
            accept=".csv"
            onChange={handleFileChange}
            className="border border-gray-300 rounded-md text-sm px-2 py-1"
          />
          <button
            onClick={handleStart}
            className="bg-blue-500 text-white py-2 rounded-md hover:bg-blue-600"
          >
            Process CSV
          </button>
        </div>
      )}

      {processing && <div className="text-center">Processing...</div>}

      {resultsReady && (
        <>
          <div className="flex gap-2 mt-4">
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

          <table className="min-w-full text-sm border border-gray-300 rounded-md text-left mt-2">
            <thead className="bg-gray-100">
              <tr>
                <th className="p-2 border">Select</th>
                <th className="p-2 border">Number</th>
                <th className="p-2 border">Latitude</th>
                <th className="p-2 border">Longitude</th>
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
                    <td className="p-2 border">{row.d}</td>
                    <td className="p-2 border">{row.lat}</td>
                    <td className="p-2 border">{row.lon}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          <div className="flex gap-2 justify-center mt-3">
            <button
              disabled={currentPage === 0}
              onClick={() => goToPage(currentPage - 1)}
              className="px-3 py-1 border rounded hover:bg-gray-100"
            >
              Previous
            </button>

            {renderPageButtons()}

            <button
              disabled={currentPage === totalPages - 1}
              onClick={() => goToPage(currentPage + 1)}
              className="px-3 py-1 border rounded hover:bg-gray-100"
            >
              Next
            </button>
          </div>

          <GISMap mapPoints={mapPoints} />
        </>
      )}
    </div>
  );
};

export default GISPage;
