import React, { useState, useEffect } from "react";
import GISMap from "./GISMap";
import { saveAs } from "file-saver";

const GISPage = () => {
  const [selectedFile, setSelectedFile] = useState(null);
  const [groupedData, setGroupedData] = useState({});
  const [dGroups, setDGroups] = useState([]);
  const [selectedTerritories, setSelectedTerritories] = useState([]);
  const [currentPage, setCurrentPage] = useState(0);
  const [processing, setProcessing] = useState(false);
  const [resultsReady, setResultsReady] = useState(false);
  const [selectedRows, setSelectedRows] = useState([]);
  const [mapPoints, setMapPoints] = useState([]);
  const [readyToShowMap, setReadyToShowMap] = useState(false);

  const handleFileChange = (e) => setSelectedFile(e.target.files[0]);

  const handleStart = async () => {
    if (!selectedFile) return alert("Please upload a CSV first.");
    const formData = new FormData();
    formData.append("file", selectedFile);
    setProcessing(true);

    try {
      const response = await fetch("http://geocode-na1k.onrender.com/api/gis", {
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

      const allKeys = Object.keys(grouped);
      setGroupedData(grouped);
      setDGroups(allKeys);
      setSelectedTerritories(allKeys);

      const allRows = allKeys.flatMap((d, page) =>
        grouped[d].map((_, idx) => `${page}-${idx}`)
      );
      setSelectedRows(allRows);

      setResultsReady(true);
      setCurrentPage(0);
    } catch (err) {
      alert(err.message);
    } finally {
      setProcessing(false);
    }
  };

  const handleTerritoryToggle = (territory, pageIndex) => {
    const newSelectedTerritories = selectedTerritories.includes(territory)
      ? selectedTerritories.filter((t) => t !== territory)
      : [...selectedTerritories, territory];

    setSelectedTerritories(newSelectedTerritories);

    const rowKeys = (groupedData[territory] || []).map((_, idx) => `${pageIndex}-${idx}`);
    setSelectedRows((prev) => {
      if (selectedTerritories.includes(territory)) {
        return prev.filter((key) => !rowKeys.includes(key));
      } else {
        return [...new Set([...prev, ...rowKeys])];
      }
    });
  };

  const handleSelectAll = () => {
    setSelectedTerritories(dGroups);
    const allRows = dGroups.flatMap((d, page) =>
      (groupedData[d] || []).map((_, idx) => `${page}-${idx}`)
    );
    setSelectedRows(allRows);
  };

  const handleSelectNone = () => {
    setSelectedTerritories([]);
    setSelectedRows([]);
    setMapPoints([]);
    setReadyToShowMap(false);
  };

  const handleRowToggle = (key) => {
    setSelectedRows((prev) =>
      prev.includes(key) ? prev.filter((i) => i !== key) : [...prev, key]
    );
  };

  const handleProcessTerritories = () => {
    const points = getSelectedLocations();
    setMapPoints(points);
    setReadyToShowMap(true);
  };

  const handleDownloadCSV = () => {
    const selectedData = selectedRows
      .map((key) => {
        const [page, idx] = key.split("-").map(Number);
        const dVal = dGroups[page];
        return groupedData[dVal]?.[idx];
      })
      .filter(Boolean);

    const csvHeader = Object.keys(selectedData[0] || {}).join(",");
    const csvBody = selectedData.map((row) => Object.values(row).join(",")).join("\n");
    const blob = new Blob([csvHeader + "\n" + csvBody], { type: "text/csv;charset=utf-8;" });
    saveAs(blob, "selected_territories.csv");
  };

  const getSelectedLocations = () => {
    return selectedRows
      .map((key) => {
        const [page, idx] = key.split("-").map(Number);
        const dVal = dGroups[page];
        return groupedData[dVal]?.[idx];
      })
      .filter(Boolean)
      .map((row) => {
        const lat = parseFloat(row.lat);
        const lon = parseFloat(row.lon);
        return !isNaN(lat) && !isNaN(lon) ? { lat, lon } : null;
      })
      .filter(Boolean);
  };

  const goToPage = (page) => {
    setCurrentPage(page);
    setSelectedRows([]);
    setMapPoints([]);
    setReadyToShowMap(false);
  };

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

    const lastPages = [totalPages - 2, totalPages - 1];
    if (totalPages > end + 1) {
      buttons.push(<span key="dots" className="px-2">...</span>);
    }

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
        Import CSV from NWS Export
      </h3>

      {!processing && !resultsReady && (
        <div className="flex flex-col gap-4 ml-auto mr-auto max-w-[300px]">
          <input
            type="file"
            accept=".csv"
            onChange={handleFileChange}
            className="block w-full text-sm text-white bg-blue-600 rounded-md cursor-pointer 
                       hover:bg-blue-700 transition py-2 px-4 text-center"
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
              Deselect All
            </button>
          </div>

          <div className="mt-4">
            <h4 className="text-md font-semibold mb-2">Select Territories</h4>
            <div className="flex flex-wrap gap-2 mb-4">
              {dGroups.map((d, index) => (
                <label key={d} className="flex items-center gap-2 border px-3 py-1 rounded cursor-pointer">
                  <input
                    type="checkbox"
                    checked={selectedTerritories.includes(d)}
                    onChange={() => handleTerritoryToggle(d, index)}
                  />
                  <span>{d}</span>
                </label>
              ))}
            </div>
          </div>

          <table className="min-w-full text-sm border border-gray-300 rounded-md text-left mt-4">
            <thead className="bg-gray-100">
              <tr>
                <th className="p-2 border">Select</th>
                <th className="p-2 border">Territory</th>
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

          <div className="text-center mt-6 flex flex-col items-center gap-3">
            <button
              onClick={handleProcessTerritories}
              className="bg-green-600 text-white px-6 py-2 rounded hover:bg-green-700"
            >
              Process Territories
            </button>
            {readyToShowMap && (
              <button
                onClick={handleDownloadCSV}
                className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700"
              >
                Download CSV
              </button>
            )}
          </div>

          {readyToShowMap && <GISMap mapPoints={mapPoints} />}

          <p className="text-xl text-gray-500 mt-10 text-center">
            <strong>Instructions:</strong>{" "}
            Go to <a href="/" className="text-blue-600 underline hover:text-blue-800">Home</a>, <em>Import or Export → Export → Territories → Territories (CSV)</em>
          </p>
        </>
      )}
    </div>
  );
};

export default GISPage;