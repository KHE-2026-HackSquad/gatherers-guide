// routes/forecast.js
// Returns processed forecast data for the React dashboard charts
const express         = require("express");
const router          = express.Router();
const { getForecast } = require("../services/nwsOracle");

// GET /forecast — full 7-day hourly data for charts
router.get("/", async (req, res) => {
  try {
    const forecast = await getForecast();
    const hours    = 168; // 7 days

    // Build a clean array of hourly objects for the frontend
    const hourly = forecast.time.slice(0, hours).map((dt, i) => ({
      time:          dt.toISOString(),
      temperature:   parseFloat((forecast.temperature_2m?.[i] ?? 0).toFixed(1)),
      feelsLike:     parseFloat((forecast.apparent_temperature?.[i] ?? 0).toFixed(1)),
      precipitation: parseFloat((forecast.precipitation?.[i] ?? 0).toFixed(3)),
      humidity:      Math.round(forecast.relative_humidity_2m?.[i] ?? 0),
      windSpeed:     parseFloat((forecast.wind_speed_10m?.[i] ?? 0).toFixed(1)),
      windGusts:     parseFloat((forecast.wind_gusts_10m?.[i] ?? 0).toFixed(1)),
      snowfall:      parseFloat((forecast.snowfall?.[i] ?? 0).toFixed(2)),
      weatherCode:   forecast.weather_code?.[i] ?? 0,
      soilTemp:      parseFloat((forecast.soil_temperature_0cm?.[i] ?? 0).toFixed(1)),
      soilMoisture:  parseFloat((forecast.soil_moisture_0_to_1cm?.[i] ?? 0).toFixed(4)),
    }));

    // Spray window: wind < 10mph, humidity 40–90%, no rain
    const sprayWindows = hourly.filter(h =>
      h.windSpeed  < 10    &&
      h.humidity   >= 40   &&
      h.humidity   <= 90   &&
      h.precipitation < 0.01
    ).map(h => h.time);

    res.json({
      hourly,
      sprayWindows,
      fetchedAt: new Date().toISOString(),
    });

  } catch (err) {
    console.error("[forecast]", err);
    res.status(500).json({ error: "Forecast fetch failed", detail: err.message });
  }
});

module.exports = router;
