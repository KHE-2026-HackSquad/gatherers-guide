// components/CurrentConditions.jsx
import React from "react";

const WMO_CODES = {
  0: "Clear sky", 1: "Mainly clear", 2: "Partly cloudy", 3: "Overcast",
  45: "Fog", 48: "Icy fog",
  51: "Light drizzle", 53: "Drizzle", 55: "Heavy drizzle",
  61: "Light rain", 63: "Rain", 65: "Heavy rain",
  71: "Light snow", 73: "Snow", 75: "Heavy snow",
  77: "Snow grains",
  80: "Light showers", 81: "Showers", 82: "Heavy showers",
  85: "Snow showers", 86: "Heavy snow showers",
  95: "Thunderstorm", 96: "Thunderstorm w/ hail", 99: "Thunderstorm w/ heavy hail",
};

export default function CurrentConditions({ forecast }) {
  if (!forecast?.hourly?.length) return null;

  const now = forecast.hourly[0];

  return (
    <div className="tribal-card">
      <div className="section-label">Current Conditions — Kent, OH</div>
      <div className="flex items-end gap-3 mb-4">
        <span className="text-5xl font-display font-bold text-ember">{now.temperature}°</span>
        <span className="text-stone mb-1">Feels like {now.feelsLike}°F</span>
      </div>
      <div className="text-stone-light text-sm mb-4">
        {WMO_CODES[now.weatherCode] || "Unknown conditions"}
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
        {[
          ["💧 Humidity",     `${now.humidity}%`],
          ["🌬️ Wind",        `${now.windSpeed} mph`],
          ["💨 Gusts",        `${now.windGusts} mph`],
          ["🌡️ Soil Temp",   `${now.soilTemp}°F`],
        ].map(([label, val]) => (
          <div key={label} className="bg-ash-dark rounded-lg px-3 py-2">
            <div className="text-stone text-xs">{label}</div>
            <div className="text-stone-light font-mono">{val}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
