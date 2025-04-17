
import React, { useState } from "react";

const GISPage = () => {
  const [selectedFile, setSelectedFile] = useState(null);
  const [tableData, setTableData] = useState([]);
  const [processing, setProcessing] = useState(false);
  const [resultsReady, setResultsReady] = useState(false);
  // State to track which row index is selected
  const [selectedRowIndex, setSelectedRowIndex] = useState(null);
  // For showing or downloading the generated map/image
  const [mapBase64, setMapBase64] = useState("");

  // Handler for file upload
  const handleFileChange = (e) => {
    setSelectedFile(e.target.files[0]);
  };

  // Handler for bulk processing (uploading CSV file)
  const handleStart = async () => {
    if (!selectedFile) {
      alert("Please upload a CSV first.");
      return;
    }
    const formData = new FormData();
    formData.append("file", selectedFile);
    setProcessing(true);

    try {
      // Make sure this URL points to your bulk CSV processing endpoint.
      // (If you removed the test route in /api/gis, this will now process the CSV.)
      const response = await fetch("http://localhost:8000/api/gis", {
        method: "POST",
        body: formData,
      });
      if (!response.ok) {
        throw new Error("Processing failed.");
      }
      const json = await response.json();
      console.log("Received data:", json);
      // Assuming the Python script returns an object with a "data" array.
      setTableData(json.data);
      setResultsReady(true);
    } catch (err) {
      alert(err.message);
    } finally {
      setProcessing(false);
    }
  };

  // Handler to process only the selected row
  const handleProcessSelectedRow = async () => {
    if (selectedRowIndex === null) {
      alert("Please select exactly one row before processing.");
      return;
    }
    const rowData = tableData[selectedRowIndex];
    // Map the keys from the table to the expected keys by the Python script.
    // For example, if your rowData uses "lat" and "lon", change them to "Latitude" and "Longitude".
    const mappedRow = {
      Latitude: rowData.lat,    // change from rowData.lat to match Python's expected "Latitude"
      Longitude: rowData.lon,   // similarly for "Longitude"
      // You can pass additional fields if necessary
      ...rowData,
    };

    try {
      const response = await fetch("http://localhost:8000/api/gis/process-row", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ row: mappedRow }),
      });
      if (!response.ok) {
        throw new Error("Single-row processing failed.");
      }
      const json = await response.json();
      console.log("Single-row map result:", json);
      // Expecting json to contain something like: { map: "<base64-encoded image>" }
      setMapBase64(json.map);
    } catch (err) {
      alert(err.message);
    }
  };

  const handleDownloadMap = () => {
    if (!mapBase64) {
      alert("No map to download yet.");
      return;
    }
    const link = document.createElement("a");
    link.href = `data:image/png;base64,${mapBase64}`;
    link.download = "single_row_map.png";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="bg-[#FFFFFF] max-w-[500px] w-full rounded-[20px] border-[1px] border-gray-300 min-h-[60vh] p-5">
      <h3 className="text-lg font-semibold text-gray-900 mb-5 text-center">
        GIS Data Table
      </h3>

      {/* Step 1: Upload CSV */}
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

      {processing && (
        <div className="text-center">
          <span className="text-sm text-gray-700">Processing...</span>
        </div>
      )}

      {/* Step 2: Display the table & Single-Row Selection */}
      {resultsReady && tableData.length > 0 && (
        <div>
          <table className="min-w-full text-sm border border-gray-300 rounded-md text-left">
            <thead className="bg-gray-100">
              <tr>
                <th className="p-2 border">Select</th>
                {Object.keys(tableData[0]).map((header, idx) => (
                  <th key={idx} className="p-2 border">
                    {header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {tableData.map((row, index) => (
                <tr
                  key={index}
                  className={
                    selectedRowIndex === index ? "bg-yellow-100" : "hover:bg-gray-50"
                  }
                >
                  <td className="p-2 border text-center">
                    <input
                      type="radio"
                      name="selectedRow"
                      checked={selectedRowIndex === index}
                      onChange={() => setSelectedRowIndex(index)}
                    />
                  </td>
                  {Object.values(row).map((value, idx) => (
                    <td key={idx} className="p-2 border">
                      {value}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>

          {/* Step 3: Process Selected Row */}
          <div className="flex items-center gap-4 mt-4">
            <button
              onClick={handleProcessSelectedRow}
              className="bg-green-500 text-white px-4 py-2 rounded-md hover:bg-green-600"
            >
              Process Selected Row
            </button>
            {mapBase64 && (
              <button
                onClick={handleDownloadMap}
                className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600"
              >
                Download Map
              </button>
            )}
          </div>

          {/* Optionally, display the map image */}
          {mapBase64 && (
            <div className="mt-4">
              <h4 className="text-md font-semibold mb-2">Map Preview:</h4>
              <img
                src={`data:image/png;base64,${mapBase64}`}
                alt="Single Row Map"
                style={{ maxWidth: "100%", border: "1px solid #ccc" }}
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default GISPage;
