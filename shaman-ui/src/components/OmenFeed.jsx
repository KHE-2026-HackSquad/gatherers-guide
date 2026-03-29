// components/OmenFeed.jsx
import React from "react";

const LEVEL_STYLES = {
  DANGER:  "border-red-500  bg-red-950/40  text-red-200",
  WARNING: "border-amber-500 bg-amber-950/40 text-amber-200",
  CAUTION: "border-yellow-400 bg-yellow-950/30 text-yellow-200",
  SAFE:    "border-green-600 bg-green-950/40 text-green-200",
};

const PLANTING_LABEL = (score) => {
  if (score >= 80) return { label: "Favorable",  color: "text-moss" };
  if (score >= 50) return { label: "Cautious",   color: "text-amber-400" };
  return              { label: "Forbidden",  color: "text-red-400" };
};

export default function OmenFeed({ omen, crop }) {
  if (!omen?.omen || !omen?.prediction) return null;

  const { omen: o = {}, frostRisk = "LOW", prediction = {}, meta = {} } = omen;
  const features = prediction.features || {};
  const levelStyle = LEVEL_STYLES[o.level] || LEVEL_STYLES.SAFE;
  const planting   = PLANTING_LABEL(prediction.plantingScore ?? 0);
  const lossPercent = Math.round((prediction.cropLossProbability ?? 0) * 100);
  const confidence = prediction.confidence ?? 0;
  const recommendedWaitDays = prediction.recommendedWaitDays ?? 0;

  return (
    <div className="flex flex-col gap-6 animate-rise">

      {/* ── Omen banner ── */}
      <div className={`border-l-4 rounded-r-xl p-6 ${levelStyle}`}>
        <div className="section-label">The Shaman Speaks</div>
        <div className="flex items-start gap-4">
          <span className="text-4xl animate-flicker">{o.icon}</span>
          <p className="font-display text-lg leading-relaxed">{o.message}</p>
        </div>
      </div>

      {/* ── Stats row ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="stat-chip">
          <span className="label">Crop Loss Risk</span>
          <span className="value">{lossPercent}<span className="text-stone text-sm">%</span></span>
          <span className="unit">probability</span>
        </div>
        <div className="stat-chip">
          <span className="label">Planting Score</span>
          <span className={`value ${planting.color}`}>{prediction.plantingScore}</span>
          <span className={`unit font-semibold ${planting.color}`}>{planting.label}</span>
        </div>
        <div className="stat-chip">
          <span className="label">Frost Spirit</span>
          <span className={`value ${frostRisk === "HIGH" ? "text-blue-400" : "text-moss"}`}>
            {frostRisk}
          </span>
          <span className="unit">next 48 hrs</span>
        </div>
        <div className="stat-chip">
          <span className="label">Wait Cycles</span>
          <span className="value">{recommendedWaitDays}</span>
          <span className="unit">sun-cycles</span>
        </div>
      </div>

      {/* ── Feature details ── */}
      <div className="tribal-card">
        <div className="section-label">Shaman's Reading</div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-x-6 gap-y-3 text-sm">
          {[
            ["Min Temp (48h)",    `${features.min_temp ?? "N/A"}°F`],
            ["Frost Hours",      `${features.frost_degree_hours ?? "N/A"} hrs`],
            ["7-Day Precip",     `${features.precip_7day_in ?? "N/A"}" in`],
            ["Humidity",         `${features.avg_humidity ?? "N/A"}%`],
            ["Wind Speed",       `${features.avg_wind_speed ?? "N/A"} mph`],
            ["Soil Temp",        `${features.avg_soil_temp ?? "N/A"}°F`],
            ["Soil Saturation",  `${features.soil_saturation_index != null ? (features.soil_saturation_index * 100).toFixed(0) : "N/A"}%`],
            ["Model Source",     prediction.source ?? "unknown"],
          ].map(([label, val]) => (
            <div key={label}>
              <div className="text-stone text-xs uppercase tracking-wider">{label}</div>
              <div className="text-stone-light font-mono text-sm">{val}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Confidence bar ── */}
      {confidence > 0 && (
        <div className="flex items-center gap-3 text-xs text-stone">
          <span>Model confidence</span>
          <div className="flex-1 bg-ash-dark rounded-full h-1.5">
            <div
              className="bg-ember rounded-full h-1.5 transition-all duration-700"
              style={{ width: `${Math.round(confidence * 100)}%` }}
            />
          </div>
          <span>{Math.round(confidence * 100)}%</span>
        </div>
      )}
    </div>
  );
}
