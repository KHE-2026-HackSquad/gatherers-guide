// hooks/useWeather.js
import { useState, useEffect, useCallback } from "react";
import { fetchOmen, fetchForecast } from "../services/api";

export function useWeather(crop = "corn") {
  const [omen,     setOmen]     = useState(null);
  const [forecast, setForecast] = useState(null);
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [omenData, forecastData] = await Promise.all([
        fetchOmen(crop),
        fetchForecast(),
      ]);
      setOmen(omenData);
      setForecast(forecastData);
      setLastUpdated(new Date());
    } catch (err) {
      setError(err.message || "Failed to reach the Shaman");
    } finally {
      setLoading(false);
    }
  }, [crop]);

  useEffect(() => {
    load();
    // Auto-refresh every 10 minutes
    const interval = setInterval(load, 10 * 60 * 1000);
    return () => clearInterval(interval);
  }, [load]);

  return { omen, forecast, loading, error, lastUpdated, refresh: load };
}
