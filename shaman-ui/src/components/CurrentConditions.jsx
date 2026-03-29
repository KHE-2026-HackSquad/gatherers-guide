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

      {/* Centered hero block */}
      <div className="text-center mb-5">
        <p className="text-xs font-medium tracking-widest uppercase text-stone mb-2">
          Kent, OH — current conditions
        </p>
        <p className="text-7xl font-display font-bold text-ember leading-none mb-1">
          {now.temperature}°
        </p>
        <p className="text-stone-light text-base mb-1">
          {WMO_CODES[now.weatherCode] || "Unknown conditions"}
        </p>
        <p className="text-stone text-sm">
          Feels like {now.feelsLike}°F
        </p>
      </div>

      {/* Divider */}
      <div className="border-t border-ash mb-4" />

      {/* Stat grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-sm">
        {[
          ["Humidity",   `${now.humidity}%`],
          ["Wind",       `${now.windSpeed} mph`],
          ["Gusts",      `${now.windGusts} mph`],
          ["Soil temp",  `${now.soilTemp}°F`],
        ].map(([label, val]) => (
          <div key={label} className="bg-ash-dark rounded-lg px-3 py-2 text-center">
            <div className="text-stone text-xs mb-1">{label}</div>
            <div className="text-stone-light font-medium">{val}</div>
          </div>
        ))}
      </div>

    </div>
  );
}