// App.jsx
import React, { useState } from "react";
import { useWeather }        from "./hooks/useWeather";
import OmenFeed              from "./components/OmenFeed";
import RiskTimeline          from "./components/RiskTimeline";
import PlantingCalendar      from "./components/PlantingCalendar";
import SprayWindows          from "./components/SprayWindows";
import CropSelector          from "./components/CropSelector";
import CurrentConditions     from "./components/CurrentConditions";

export default function App() {
  const [crop, setCrop]       = useState("corn");
  const { omen, forecast, loading, error, lastUpdated, refresh } = useWeather(crop);

  return (
    <div className="min-h-screen text-stone-light">

      {/* ── Header ── */}
      <header className="border-b border-stone/10 bg-ash/80 backdrop-blur sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <h1 className="font-display text-xl sm:text-2xl text-ember leading-tight">
              The Gatherer's Guide
            </h1>
            <p className="text-stone text-xs tracking-widest uppercase">
              Digital Shaman of Portage County
            </p>
          </div>
          <div className="flex items-center gap-3">
            {lastUpdated && (
              <span className="text-stone text-xs hidden sm:block">
                Updated {lastUpdated.toLocaleTimeString()}
              </span>
            )}
            <button
              onClick={refresh}
              disabled={loading}
              className="text-xs border border-stone/30 text-stone hover:text-ember hover:border-ember
                         px-3 py-1.5 rounded-full transition-all disabled:opacity-40"
            >
              {loading ? "Consulting…" : "↺ Refresh"}
            </button>
          </div>
        </div>
      </header>

      {/* ── Main ── */}
      <main className="max-w-5xl mx-auto px-4 py-8 flex flex-col gap-8">

        {/* Crop selector */}
        <div>
          <div className="section-label">Your Crop</div>
          <CropSelector selected={crop} onChange={setCrop} />
        </div>

        {/* Loading state */}
        {loading && !omen && (
          <div className="flex flex-col items-center gap-4 py-20 text-stone animate-pulse">
            <span className="text-5xl animate-flicker">🔥</span>
            <span className="font-display text-lg">The Shaman consults the spirits…</span>
          </div>
        )}

        {/* Error state */}
        {error && (
          <div className="border border-red-600 bg-red-950/40 rounded-xl p-6 text-red-300">
            <div className="font-display text-lg mb-1">⚠️ The Oracle is silent</div>
            <div className="text-sm">{error}</div>
            <button onClick={refresh} className="mt-3 text-xs underline text-red-400">
              Try again
            </button>
          </div>
        )}

        {/* Content */}
        {omen?.omen && omen?.prediction && (
          <>
            <OmenFeed omen={omen} crop={crop} />
            <CurrentConditions forecast={forecast} />
            <RiskTimeline forecast={forecast} />
            <PlantingCalendar forecast={forecast} crop={crop} />
            <SprayWindows forecast={forecast} />
          </>
        )}

        {/* KHE badge */}
        <div className="text-center text-stone text-xs pt-4 border-t border-stone/10">
          KHE 2026 · Data Science Track · Kent, Ohio ·{" "}
          <span className="text-ember">Open-Meteo</span> ×{" "}
          <span className="text-ember">XGBoost</span>
        </div>

      </main>
    </div>
  );
}
