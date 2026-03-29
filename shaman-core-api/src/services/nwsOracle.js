// services/nwsOracle.js
// Fetches live hourly forecast for Kent, OH from Open-Meteo (free, no key)

const KENT_LAT = 41.1537;
const KENT_LON = -81.3579;

const FORECAST_FIELDS = [
  "temperature_2m", "dew_point_2m", "precipitation", "relative_humidity_2m",
  "apparent_temperature", "rain", "snowfall", "snow_depth", "weather_code",
  "wind_speed_10m", "wind_direction_10m", "wind_gusts_10m",
  "soil_temperature_0cm", "soil_temperature_6cm",
  "soil_temperature_18cm", "soil_temperature_54cm",
  "soil_moisture_1_to_3cm", "soil_moisture_0_to_1cm",
  "soil_moisture_9_to_27cm", "soil_moisture_27_to_81cm",
];

let cache     = null;
let lastFetch = 0;
const CACHE_TTL = 10 * 60 * 1000; // 10 minutes

async function getForecast(lat = KENT_LAT, lon = KENT_LON) {
  const now = Date.now();
  if (cache && now - lastFetch < CACHE_TTL) return cache;

  const { fetchWeatherApi } = await import("openmeteo");

  const params = {
    latitude:           lat,
    longitude:          lon,
    hourly:             FORECAST_FIELDS,
    timezone:           "auto",
    temperature_unit:   "fahrenheit",
    wind_speed_unit:    "mph",
    precipitation_unit: "inch",
  };

  const responses       = await fetchWeatherApi("https://api.open-meteo.com/v1/forecast", params);
  const response        = responses[0];
  const utcOffsetSeconds = response.utcOffsetSeconds();
  const hourly          = response.hourly();

  const times = Array.from(
    { length: (Number(hourly.timeEnd()) - Number(hourly.time())) / hourly.interval() },
    (_, i) => new Date((Number(hourly.time()) + i * hourly.interval() + utcOffsetSeconds) * 1000)
  );

  const data = { time: times };
  FORECAST_FIELDS.forEach((field, i) => {
    data[field] = hourly.variables(i).valuesArray();
  });

  cache     = data;
  lastFetch = now;
  return data;
}

module.exports = { getForecast };
