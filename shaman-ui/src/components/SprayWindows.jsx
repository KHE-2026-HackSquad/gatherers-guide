// components/SprayWindows.jsx
import React, { useMemo } from "react";

export default function SprayWindows({ forecast }) {
  const windows = useMemo(() => {
    if (!forecast?.sprayWindows?.length) return [];

    // Group consecutive hours into windows
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
      startStr: g.start.toLocaleString("en-US", { weekday: "short", month: "numeric", day: "numeric", hour: "numeric", hour12: true }),
      endStr:   g.end.toLocaleString("en-US", { hour: "numeric", hour12: true }),
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
          ⚠️ No favorable spray windows found in the next 7 days. The wind and rain spirits are restless.
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {windows.map((w, i) => (
            <div
              key={i}
              className="flex items-center justify-between bg-moss/10 border border-moss/30 rounded-lg px-4 py-3"
            >
              <div>
                <span className="text-moss font-semibold text-sm">✅ {w.startStr}</span>
                <span className="text-stone text-sm"> → {w.endStr}</span>
              </div>
              <span className="text-stone text-xs bg-ash-dark px-2 py-1 rounded">
                {w.durationHrs}h window
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
