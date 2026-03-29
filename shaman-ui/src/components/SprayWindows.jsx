// components/SprayWindows.jsx
import React, { useMemo } from "react";

export default function SprayWindows({ forecast }) {
  const windows = useMemo(() => {
    if (!forecast?.sprayWindows?.length) return [];

    const groups = [];
    let current = null;

    forecast.sprayWindows.forEach(isoTime => {
      const dt = new Date(isoTime);
      if (!current) {
        current = { start: dt, end: dt };
      } else if (dt - current.end <= 3600001) {
        current.end = dt;
      } else {
        groups.push(current);
        current = { start: dt, end: dt };
      }
    });
    if (current) groups.push(current);

    return groups.slice(0, 6).map(g => ({
      dayStr: g.start.toLocaleString("en-US", { weekday: "short", month: "numeric", day: "numeric" }),
      startTime: g.start.toLocaleString("en-US", { hour: "numeric", hour12: true }),
      endTime: g.end.toLocaleString("en-US", { hour: "numeric", hour12: true }),
      durationHrs: Math.round((g.end - g.start) / 3600000) + 1,
    }));
  }, [forecast]);

  return (
    <div className="tribal-card">
      <div className="section-label">Safe Spray Windows</div>
      <p className="text-stone text-sm mb-4">
        Hours where wind &lt;10 mph, humidity 40–90%, and no precipitation — safe for pesticide or herbicide application.
      </p>

      {windows.length === 0 ? (
        <div className="text-amber-400 text-sm">
          ⚠️ No favorable spray windows found in the next 7 days.
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {windows.map((w, i) => (
            <div
              key={i}
              className="flex items-center gap-3 bg-stone/5 border border-stone/15 rounded-xl px-4 py-3"
            >
              {/* Status dot */}
              <div className="w-2 h-2 rounded-full bg-moss flex-shrink-0" />

              {/* Day badge */}
              <span className="text-xs font-medium text-sky-700 bg-sky-50 rounded-md px-2 py-1 whitespace-nowrap flex-shrink-0">
                {w.dayStr}
              </span>

              {/* Time range */}
              <span className="text-sm font-medium text-primary flex-1">
                {w.startTime}
                <span className="text-stone mx-1">→</span>
                {w.endTime}
              </span>

              {/* Duration pill */}
              <span className="text-xs text-emerald-700 bg-emerald-50 rounded-md px-2 py-1 whitespace-nowrap flex-shrink-0">
                {w.durationHrs}h
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}