// components/PlantingCalendar.jsx
import React, { useMemo } from "react";

function scoreDay(hours) {
  if (!hours.length) return 0;
  let score = 100;
  const minTemp = Math.min(...hours.map(h => h.temperature));
  const totalPrecip = hours.reduce((a, h) => a + h.precipitation, 0);
  const maxGust = Math.max(...hours.map(h => h.windGusts));
  const avgHumidity = hours.reduce((a, h) => a + h.humidity, 0) / hours.length;

  if (minTemp < 32)        score -= 40;
  else if (minTemp < 36)   score -= 20;
  if (totalPrecip > 0.5)   score -= 30;
  else if (totalPrecip > 0.2) score -= 15;
  if (maxGust > 35)        score -= 20;
  else if (maxGust > 20)   score -= 10;
  if (avgHumidity > 90)    score -= 10;

  return Math.max(0, score);
}

const RATING = (score) => {
  if (score >= 75) return { label: "Favorable",  bg: "bg-moss/20",    border: "border-moss",    text: "text-moss"        };
  if (score >= 45) return { label: "Cautious",   bg: "bg-amber-900/30", border: "border-amber-500", text: "text-amber-400" };
  return              { label: "Forbidden",  bg: "bg-red-950/40", border: "border-red-600",  text: "text-red-400"   };
};

export default function PlantingCalendar({ forecast }) {
  const days = useMemo(() => {
    if (!forecast?.hourly) return [];

    const byDay = {};
    forecast.hourly.forEach(h => {
      const day = h.time.slice(0, 10);
      if (!byDay[day]) byDay[day] = [];
      byDay[day].push(h);
    });

    return Object.entries(byDay).slice(0, 7).map(([date, hours]) => {
      const score = scoreDay(hours);
      const rating = RATING(score);
      const d = new Date(date + "T12:00:00");
      return {
        date,
        dayName:  d.toLocaleDateString("en-US", { weekday: "short" }),
        dayNum:   d.getDate(),
        score,
        ...rating,
        minTemp:  Math.min(...hours.map(h => h.temperature)).toFixed(0),
        maxTemp:  Math.max(...hours.map(h => h.temperature)).toFixed(0),
        precip:   hours.reduce((a, h) => a + h.precipitation, 0).toFixed(2),
      };
    });
  }, [forecast]);

  if (!days.length) return null;

  return (
    <div className="tribal-card">
      <div className="section-label">7-Day Planting Calendar</div>
      <div className="grid grid-cols-7 gap-2">
        {days.map(day => (
          <div
            key={day.date}
            className={`rounded-lg border p-3 flex flex-col items-center gap-1 text-center ${day.bg} ${day.border}`}
          >
            <span className="text-stone text-xs uppercase tracking-wide">{day.dayName}</span>
            <span className="text-stone-light text-lg font-semibold">{day.dayNum}</span>
            <span className={`text-xs font-bold ${day.text}`}>{day.label}</span>
            <span className={`text-xl font-display font-bold ${day.text}`}>{day.score}</span>
            <div className="text-xs text-stone mt-1">
              <div>{day.minTemp}° – {day.maxTemp}°F</div>
              <div>{day.precip}"</div>
            </div>
          </div>
        ))}
      </div>
      <div className="flex gap-4 mt-4 text-xs text-stone">
        <span><span className="text-moss font-bold">75–100</span> Favorable</span>
        <span><span className="text-amber-400 font-bold">45–74</span> Cautious</span>
        <span><span className="text-red-400 font-bold">0–44</span> Forbidden</span>
      </div>
    </div>
  );
}
