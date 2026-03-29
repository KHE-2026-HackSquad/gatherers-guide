// routes/forecast.js
// Returns processed forecast data starting from the current hour for React charts
const express         = require("express");
const router          = express.Router();
const { getForecast } = require("../services/nwsOracle");

// GET /forecast — up-to-date 7-day hourly data for charts
router.get("/", async (req, res) => {
  try {
    const forecast = await getForecast(); //
    
    // 1. Map all available data from the Oracle first
    const allHourly = forecast.time.map((dt, i) => ({
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

    // 2. Define "Current Hour" (floor to the top of the hour for accuracy)
    const currentHour = new Date();
    currentHour.setMinutes(0, 0, 0, 0);

    // 3. Filter out past data (like 3/28) and take the next 168 hours (7 days)
    const hourly = allHourly
      .filter(h => new Date(h.time) >= currentHour)
      .slice(0, 168);

    // 4. Calculate spray windows only for future hours
    // Window: wind < 10mph, humidity 40–90%, and no rain
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
    res.status(500).json({ 
      error: "Forecast fetch failed", 
      detail: err.message 
    });
  }
});

module.exports = router;