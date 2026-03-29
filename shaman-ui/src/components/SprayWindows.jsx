import React from 'react';

const SprayWindows = ({ forecast }) => {
  if (!forecast || !forecast.sprayWindows || forecast.sprayWindows.length === 0) {
    return (
      <div className="tribal-card p-6 text-center">
        <p className="text-stone text-sm">No safe spray windows detected in the current cycle.</p>
      </div>
    );
  }

  // Helper to group consecutive hourly windows into blocks
  const groupWindows = (times) => {
    const blocks = [];
    if (times.length === 0) return blocks;

    let start = new Date(times[0]);
    let prev = new Date(times[0]);

    for (let i = 1; i < times.length; i++) {
      const current = new Date(times[i]);
      
      // Check if current hour is consecutive (1 hour difference)
      if ((current - prev) / 3600000 === 1) {
        prev = current;
      } else {
        const duration = (prev - start) / 3600000 + 1;
        blocks.push({
          start: start,
          end: prev,
          duration: Math.round(duration)
        });
        start = current;
        prev = current;
      }
    }

    // Push the final block
    const finalDuration = (prev - start) / 3600000 + 1;
    blocks.push({
      start: start,
      end: prev,
      duration: Math.round(finalDuration)
    });

    return blocks;
  };

  const blocks = groupWindows(forecast.sprayWindows);

  const formatTime = (date) => {
    return date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
  };

  const formatDate = (date) => {
    return date.toLocaleDateString([], { weekday: 'short', month: 'numeric', day: 'numeric' });
  };

  return (
    <div className="tribal-card">
      <div className="section-label mb-2">SAFE SPRAY WINDOWS</div>
      <p className="text-stone text-[11px] mb-6 uppercase tracking-wider">
        Wind &lt; 10 mph | Humidity 40–90% | Zero Precipitation
      </p>

      <div className="grid gap-3">
        {blocks.map((block, idx) => (
          <div 
            key={idx} 
            className="flex items-center justify-between p-4 bg-ash-dark/50 border border-stone/20 rounded-lg hover:border-stone/40 transition-colors"
          >
            <div className="flex flex-col gap-1">
              <span className="text-stone-light text-xs font-semibold uppercase tracking-widest">
                {formatDate(block.start)}
              </span>
              <span className="text-white text-lg font-medium">
                {formatTime(block.start)} — {formatTime(block.end)}
              </span>
            </div>

            <div className="flex items-end flex-col">
              <span className="bg-stone/10 border border-stone/20 px-3 py-1 rounded text-[10px] font-bold text-stone-light uppercase tracking-tighter">
                {block.duration}h window
              </span>
              <span className="text-[10px] text-stone mt-1 uppercase tracking-widest">
                Optimal Conditions
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default SprayWindows;