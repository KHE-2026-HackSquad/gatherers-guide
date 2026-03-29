/**
 * fetchData.mjs
 * One-time script — fetches 2015–2026 hourly weather archive from Open-Meteo
 * and saves to data/portage_county_weather_2015_2026.csv
 *
 * Run: node src/fetchData.mjs
 */

import { fetchWeatherApi } from "openmeteo";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUTPUT    = path.join(__dirname, "../data/portage_county_weather_2015_2026.csv");

const FIELDS = [
  "temperature_2m", "dew_point_2m", "precipitation", "relative_humidity_2m",
  "apparent_temperature", "rain", "snowfall", "snow_depth", "weather_code",
  "wind_speed_10m", "wind_direction_10m", "wind_gusts_10m",
  "soil_temperature_0_to_7cm", "soil_temperature_7_to_28cm",
  "soil_temperature_28_to_100cm", "soil_temperature_100_to_255cm",
  "soil_moisture_7_to_28cm", "soil_moisture_0_to_7cm",
  "soil_moisture_28_to_100cm", "soil_moisture_100_to_255cm",
];

const params = {
  latitude:           41.1537,
  longitude:         -81.3579,
  start_date:        "2015-01-12",
  end_date:          "2026-03-25",
  hourly:             FIELDS,
  timezone:          "auto",
  temperature_unit:  "fahrenheit",
  wind_speed_unit:   "mph",
  precipitation_unit:"inch",
};

console.log("Fetching Open-Meteo archive (2015–2026)...");
const responses       = await fetchWeatherApi("https://archive-api.open-meteo.com/v1/archive", params);
const response        = responses[0];
const utcOffsetSeconds = response.utcOffsetSeconds();
const hourly          = response.hourly();

const times = Array.from(
  { length: (Number(hourly.timeEnd()) - Number(hourly.time())) / hourly.interval() },
  (_, i) => new Date((Number(hourly.time()) + i * hourly.interval() + utcOffsetSeconds) * 1000)
);

const valueArrays = FIELDS.map((_, i) => hourly.variables(i).valuesArray());

console.log(`Building CSV — ${times.length.toLocaleString()} hourly records...`);

const header = ["timestamp", "date", "hour", ...FIELDS].join(",");
const rows   = times.map((dt, i) => {
  const ts   = dt.toISOString();
  const date = ts.slice(0, 10);
  const hour = String(dt.getUTCHours()).padStart(2, "0");
  const vals = valueArrays.map(arr => {
    const v = arr[i];
    return v == null ? "" : Number.isInteger(v) ? v : parseFloat(v.toFixed(4));
  });
  return [ts, date, hour, ...vals].join(",");
});

fs.mkdirSync(path.dirname(OUTPUT), { recursive: true });
fs.writeFileSync(OUTPUT, [header, ...rows].join("\n"), "utf8");

console.log(`Done — saved ${rows.length.toLocaleString()} rows → ${OUTPUT}`);
