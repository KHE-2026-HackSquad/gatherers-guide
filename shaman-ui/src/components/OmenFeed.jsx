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
  if (!omen) return null;

  const { omen: o, frostRisk, prediction, meta } = omen;
  const levelStyle = LEVEL_STYLES[o.level] || LEVEL_STYLES.SAFE;
  const planting   = PLANTING_LABEL(prediction.plantingScore);
  const lossPercent = Math.round(prediction.cropLossProbability * 100);

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
          <span className="value">{prediction.recommendedWaitDays}</span>
          <span className="unit">sun-cycles</span>
        </div>
      </div>

      {/* ── Feature details ── */}
      <div className="tribal-card">
        <div className="section-label">Shaman's Reading</div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-x-6 gap-y-3 text-sm">
          {[
            ["Min Temp (48h)",    `${prediction.features.min_temp}°F`],
            ["Frost Hours",      `${prediction.features.frost_degree_hours} hrs`],
            ["7-Day Precip",     `${prediction.features.precip_7day_in}" in`],
            ["Humidity",         `${prediction.features.avg_humidity}%`],
            ["Wind Speed",       `${prediction.features.avg_wind_speed} mph`],
            ["Soil Temp",        `${prediction.features.avg_soil_temp}°F`],
            ["Soil Saturation",  `${(prediction.features.soil_saturation_index * 100).toFixed(0)}%`],
            ["Model Source",     prediction.source],
          ].map(([label, val]) => (
            <div key={label}>
              <div className="text-stone text-xs uppercase tracking-wider">{label}</div>
              <div className="text-stone-light font-mono text-sm">{val}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Confidence bar ── */}
      {prediction.confidence > 0 && (
        <div className="flex items-center gap-3 text-xs text-stone">
          <span>Model confidence</span>
          <div className="flex-1 bg-ash-dark rounded-full h-1.5">
            <div
              className="bg-ember rounded-full h-1.5 transition-all duration-700"
              style={{ width: `${Math.round(prediction.confidence * 100)}%` }}
            />
          </div>
          <span>{Math.round(prediction.confidence * 100)}%</span>
        </div>
      )}
    </div>
  );
}
