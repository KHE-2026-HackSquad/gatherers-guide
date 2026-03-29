// components/RiskTimeline.jsx
import React, { useMemo } from "react";
import {
  Chart as ChartJS,
  CategoryScale, LinearScale, PointElement,
  LineElement, BarElement, Tooltip, Legend, Filler,
} from "chart.js";
import { Line } from "react-chartjs-2";

ChartJS.register(
  CategoryScale, LinearScale, PointElement,
  LineElement, BarElement, Tooltip, Legend, Filler
);

const FROST_LINE = 32; // °F

export default function RiskTimeline({ forecast }) {
  const { labels, temps, precip, frostFlags } = useMemo(() => {
    if (!forecast?.hourly) return { labels: [], temps: [], precip: [], frostFlags: [] };

    // Show next 72 hours
    const slice = forecast.hourly.slice(0, 72);

    return {
      labels:     slice.map(h => {
        const d = new Date(h.time);
        return `${d.getMonth() + 1}/${d.getDate()} ${String(d.getHours()).padStart(2,"0")}:00`;
      }),
      temps:      slice.map(h => h.temperature),
      precip:     slice.map(h => h.precipitation),
      frostFlags: slice.map(h => h.temperature <= FROST_LINE ? h.temperature : null),
    };
  }, [forecast]);

  if (!labels.length) return null;

  const data = {
    labels,
    datasets: [
      {
        label:           "Temperature (°F)",
        data:            temps,
        borderColor:     "#e88a1a",
        backgroundColor: "rgba(232,138,26,0.08)",
        borderWidth:     2,
        pointRadius:     0,
        pointHoverRadius: 4,
        tension:         0.4,
        fill:            true,
        yAxisID:         "yTemp",
      },
      {
        label:       "Frost Zone",
        data:        frostFlags,
        borderColor: "rgba(96,165,250,0.8)",
        backgroundColor: "rgba(96,165,250,0.15)",
        borderWidth: 0,
        pointRadius: 5,
        pointBackgroundColor: "#60a5fa",
        tension:     0,
        yAxisID:     "yTemp",
      },
      {
        label:           "Precipitation (in)",
        data:            precip,
        borderColor:     "rgba(82,168,69,0.7)",
        backgroundColor: "rgba(82,168,69,0.25)",
        borderWidth:     1.5,
        pointRadius:     0,
        tension:         0.3,
        fill:            true,
        yAxisID:         "yPrecip",
      },
    ],
  };

  const options = {
    responsive:          true,
    maintainAspectRatio: false,
    interaction: { mode: "index", intersect: false },
    plugins: {
      legend: {
        labels: {
          color: "#cfc8b5",
          font:  { family: "DM Sans", size: 12 },
          boxWidth: 12,
        },
      },
      tooltip: {
        backgroundColor: "#2e2820",
        titleColor:      "#f9c97a",
        bodyColor:       "#cfc8b5",
        borderColor:     "#5a5145",
        borderWidth:     1,
      },
    },
    scales: {
      x: {
        ticks: {
          color:       "#9c9280",
          font:        { family: "DM Mono", size: 10 },
          maxTicksLimit: 12,
          maxRotation: 0,
        },
        grid: { color: "rgba(255,255,255,0.04)" },
      },
      yTemp: {
        type:     "linear",
        position: "left",
        ticks: {
          color: "#9c9280",
          font:  { family: "DM Mono", size: 11 },
          callback: (v) => `${v}°F`,
        },
        grid: { color: "rgba(255,255,255,0.04)" },
        // draw frost line
        afterDataLimits(axis) {
          axis.min = Math.min(axis.min, 20);
        },
      },
      yPrecip: {
        type:     "linear",
        position: "right",
        ticks: {
          color: "#52a845",
          font:  { family: "DM Mono", size: 11 },
          callback: (v) => `${v}"`,
        },
        grid: { drawOnChartArea: false },
        min:  0,
      },
    },
    // Draw frost threshold line as annotation
    animation: { duration: 600 },
  };

  return (
    <div className="tribal-card">
      <div className="section-label">72-Hour Temperature &amp; Precipitation</div>
      <div className="flex items-center gap-3 mb-4 text-xs text-blue-400">
        <span className="inline-block w-3 h-3 rounded-full bg-blue-400" />
        Blue dots = temperature at or below frost threshold (32°F)
      </div>
      <div style={{ height: 280 }}>
        <Line data={data} options={options} />
      </div>
    </div>
  );
}
