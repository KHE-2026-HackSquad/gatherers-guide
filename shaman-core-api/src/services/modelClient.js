// services/modelClient.js
// Calls the local Python/Flask model server for XGBoost predictions

const MODEL_URL = process.env.MODEL_SERVER_URL || "http://localhost:5001/predict";

// Refined granular thresholds for Portage County, OH crops
const FROST_THRESHOLDS = {
  strawberry: 32, // Danger at freezing
  tomato:     33, // Very tender; 33F can cause damage
  soybean:    30, // More sensitive than corn during emergence
  corn:       28, // Can handle a light frost if growing point is below ground
  wheat:      24, // Very hardy winter/spring variety threshold
};

function buildFeatureVector(forecast, cropType = "corn") {
  // 1. Define "Now" (floor to the top of the hour) to filter out past data
  const now = new Date();
  now.setMinutes(0, 0, 0, 0);

  // 2. Map forecast into a combined array so we can filter all fields by time simultaneously
  const combined = (forecast.time || []).map((t, i) => ({
    time:      new Date(t),
    temp:      forecast.temperature_2m?.[i] ?? 50,
    precip:    forecast.precipitation?.[i] ?? 0,
    humid:     forecast.relative_humidity_2m?.[i] ?? 60,
    wind:      forecast.wind_speed_10m?.[i] ?? 5,
    soilTemp:  forecast.soil_temperature_0cm?.[i] ?? 50,
    soilMoist: forecast.soil_moisture_0_to_1cm?.[i] ?? 0.3
  }));

  // 3. Filter for FUTURE data only (Current hour and onwards)
  const futureData = combined.filter(d => d.time >= now);

  // 4. Extract future slices for calculation
  const next48 = futureData.slice(0, 48); // Exactly the next 48 hours from NOW
  const next7d = futureData.slice(0, 168); // Next 7 days for precip accumulation

  // 5. Crop-specific threshold logic
  const threshold = FROST_THRESHOLDS[cropType] ?? 28;

  // 6. Calculate Features based strictly on future data
  const minTemp48h       = next48.length ? Math.min(...next48.map(d => d.temp)) : 50;
  // Degree-hours = sum of (threshold - temp) for each hour below threshold
  const frostDegreeHours = next48
    .filter(d => d.temp < threshold)
    .reduce((sum, d) => sum + (threshold - d.temp), 0);
  const precip7dayIn     = next7d.reduce((a, b) => a + (b.precip || 0), 0);
  
  const avgHumidity      = next48.length ? next48.reduce((a, b) => a + b.humid, 0) / next48.length : 60;
  const avgWind          = next48.length ? next48.reduce((a, b) => a + b.wind, 0) / next48.length : 5;
  const avgSoilTemp      = next48.length ? next48.reduce((a, b) => a + b.soilTemp, 0) / next48.length : 50;
  const avgSoilMoist     = next48.length ? next48.reduce((a, b) => a + b.soilMoist, 0) / next48.length : 0.3;
  
  const soilSaturation   = Math.min(avgSoilMoist / 0.5, 1.0);
  const dayOfYear        = Math.ceil((Date.now() - new Date(new Date().getFullYear(), 0, 0)) / 86400000);

  return {
    frost_degree_hours:    parseFloat(frostDegreeHours.toFixed(2)),
    min_temp:              parseFloat(minTemp48h.toFixed(2)),
    precip_7day_in:        parseFloat(precip7dayIn.toFixed(4)),
    avg_humidity:          parseFloat(avgHumidity.toFixed(2)),
    avg_wind_speed:        parseFloat(avgWind.toFixed(2)),
    avg_soil_temp:         parseFloat(avgSoilTemp.toFixed(2)),
    soil_saturation_index: parseFloat(soilSaturation.toFixed(4)),
    day_of_year:           dayOfYear,
    threshold_used:        threshold // Included for UI clarity
  };
}

async function getPrediction(forecast, cropType = "corn") {
  const features = buildFeatureVector(forecast, cropType);

  try {
    const res = await fetch(MODEL_URL, {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ features }),
    });

    if (!res.ok) throw new Error(`Model server responded ${res.status}`);

    const result = await res.json();
    const score  = result?.predictions?.[0]?.score ?? 0.5;

    return {
      cropLossProbability: parseFloat(score.toFixed(2)),
      plantingScore:       Math.max(0, Math.round(100 - score * 100)),
      recommendedWaitDays: score > 0.6 ? 3 : score > 0.3 ? 1 : 0,
      confidence:          result?.predictions?.[0]?.confidence ?? 0.85,
      source:              "xgboost",
      features,
    };
  } catch (err) {
    console.warn("[modelClient] Model server unreachable, using stub:", err.message);
    return stubPrediction(features);
  }
}

function stubPrediction(features) {
  let prob = 0.1;
  if (features.frost_degree_hours > 6)        prob += 0.35;
  if (features.min_temp < 30)                 prob += 0.25;
  if (features.soil_saturation_index > 0.8)   prob += 0.15;
  if (features.precip_7day_in > 3)            prob += 0.10;
  prob = Math.min(prob, 0.99);

  return {
    cropLossProbability: parseFloat(prob.toFixed(2)),
    plantingScore:       Math.max(0, Math.round(100 - prob * 100)),
    recommendedWaitDays: prob > 0.6 ? 3 : prob > 0.3 ? 1 : 0,
    confidence:          0,
    source:              "stub",
    features,
  };
}

module.exports = { getPrediction, buildFeatureVector };