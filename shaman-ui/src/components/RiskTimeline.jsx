import React from 'react';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, 
  Tooltip, ResponsiveContainer, ReferenceLine, Scatter 
} from 'recharts';

const RiskTimeline = ({ forecast }) => {
  if (!forecast || !forecast.hourly) return null;

  // 1. Slice to exactly 48 hours for a tighter "Critical Window" view
  const data = forecast.hourly.slice(0, 48).map(h => ({
    ...h,
    displayTime: new Date(h.time).toLocaleTimeString([], { 
      month: 'numeric', day: 'numeric', hour: '2-digit' 
    }),
    // Logic for the Blue Dots: Trigger if temp is at or below 32°F
    frostPoint: h.temperature <= 32 ? h.temperature : null
  }));

  // Custom Tooltip to keep the Shamanic theme
  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const d = payload[0].payload;
      return (
        <div className="bg-ash-dark border border-stone/50 p-3 rounded-lg shadow-xl backdrop-blur-md">
          <p className="text-ember font-bold text-xs mb-1">{d.displayTime}</p>
          <p className="text-stone-light text-sm">Temp: <span className="text-white">{d.temperature}°F</span></p>
          <p className="text-stone-light text-sm">Precip: <span className="text-sky-400">{d.precipitation}"</span></p>
          {d.temperature <= 32 && (
            <p className="text-sky-300 text-[10px] mt-1 italic">❄️ Frost Spirit Active</p>
          )}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="tribal-card overflow-hidden">
      <div className="section-label mb-2">48-HOUR TEMPERATURE & PRECIPITATION</div>
      <div className="flex items-center gap-4 mb-6 text-[10px] uppercase tracking-widest text-stone">
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-sky-500 shadow-[0_0_8px_rgba(14,165,233,0.8)]"></span>
          <span>Blue dots = Frost Threshold (≤32°F)</span>
        </div>
      </div>

      <div className="h-[300px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="tempGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="#f59e0b" stopOpacity={0}/>
              </linearGradient>
              <linearGradient id="precipGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.4}/>
                <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0}/>
              </linearGradient>
            </defs>
            
            <CartesianGrid strokeDasharray="3 3" stroke="#2d2d2d" vertical={false} />
            
            <XAxis 
              dataKey="displayTime" 
              stroke="#57534e" 
              fontSize={9}
              tickSize={10}
              interval={5} // Shows label every 6 hours
            />
            
            <YAxis yAxisId="left" stroke="#57534e" fontSize={10} unit="°" />
            <YAxis yAxisId="right" orientation="right" stroke="#57534e" fontSize={10} unit='"' />

            <Tooltip content={<CustomTooltip />} />

            {/* Temperature Line */}
            <Area
              yAxisId="left"
              type="monotone"
              dataKey="temperature"
              stroke="#f59e0b"
              strokeWidth={2}
              fillOpacity={1}
              fill="url(#tempGradient)"
              name="Temperature"
            />

            {/* Precipitation Area */}
            <Area
              yAxisId="right"
              type="step"
              dataKey="precipitation"
              stroke="#0ea5e9"
              strokeWidth={1}
              fillOpacity={1}
              fill="url(#precipGradient)"
              name="Precipitation"
            />

            {/* Frost Spirit Dots */}
            <Scatter
              yAxisId="left"
              dataKey="frostPoint"
              fill="#0ea5e9"
              shape="circle"
              className="drop-shadow-[0_0_5px_#0ea5e9]"
            />

            {/* Zero Line for Precipitation */}
            <ReferenceLine yAxisId="right" y={0} stroke="#444" />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default RiskTimeline;