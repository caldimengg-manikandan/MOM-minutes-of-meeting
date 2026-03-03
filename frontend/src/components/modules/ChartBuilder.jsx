import React, { useState } from "react";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ResponsiveContainer,
} from "recharts";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

const ChartBuilder = ({ datasetId, columns }) => {
  const [xAxis, setXAxis] = useState("");
  const [yAxis, setYAxis] = useState("");
  const [chartType, setChartType] = useState("bar");
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);

  const loadChart = async () => {
    if (!xAxis || !yAxis) {
      alert("Select both X and Y columns");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(
        `${API_BASE_URL}/datasets/${datasetId}/chart?x=${xAxis}&y=${yAxis}`
      );

      if (!res.ok) throw new Error("Chart API failed");

      const json = await res.json();

      const chartData = json.x.map((xVal, i) => ({
        x: xVal,
        y: Number(json.y[i]) || 0,
      }));

      setData(chartData);
    } catch (err) {
      console.error("Chart load error:", err);
      alert("Failed to load chart");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white border border-gray-300 rounded-xl p-6 space-y-4">
      <h3 className="text-lg font-semibold">Build Chart</h3>

      {/* Controls */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <select
          className="border p-2 rounded"
          value={xAxis}
          onChange={(e) => setXAxis(e.target.value)}
        >
          <option value="">X-Axis</option>
          {columns.map((col) => (
            <option key={col.column_name} value={col.column_name}>
              {col.column_name}
            </option>
          ))}
        </select>

        <select
          className="border p-2 rounded"
          value={yAxis}
          onChange={(e) => setYAxis(e.target.value)}
        >
          <option value="">Y-Axis</option>
          {columns.map((col) => (
            <option key={col.column_name} value={col.column_name}>
              {col.column_name}
            </option>
          ))}
        </select>

        <select
          className="border p-2 rounded"
          value={chartType}
          onChange={(e) => setChartType(e.target.value)}
        >
          <option value="bar">Bar</option>
          <option value="line">Line</option>
        </select>

        <button
          onClick={loadChart}
          className="bg-blue-600 text-white rounded px-4 py-2 hover:bg-blue-700"
        >
          {loading ? "Loading..." : "Generate"}
        </button>
      </div>

      {/* Chart */}
      {data.length > 0 && (
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            {chartType === "bar" ? (
              <BarChart data={data}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="x" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="y" />
              </BarChart>
            ) : (
              <LineChart data={data}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="x" />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="y" />
              </LineChart>
            )}
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
};

export default ChartBuilder;
