// services/modelClient.js
// Calls the local Python/Flask model server for XGBoost predictions

const MODEL_URL = process.env.MODEL_SERVER_URL || "http://localhost:5001/predict";

const FROST_THRESHOLDS = {
  strawberry: 32, tomato: 33, corn: 28, soybean: 28, wheat: 22,
};

function buildFeatureVector(forecast, cropType = "corn") {
  const temps    = Array.from(forecast.temperature_2m   || []);
  const precip   = Array.from(forecast.precipitation    || []);
  const humidity = Array.from(forecast.relative_humidity_2m || []);
  const wind     = Array.from(forecast.wind_speed_10m   || []);
  const soilTemp = Array.from(forecast.soil_temperature_0cm || []);
  const soilMoist= Array.from(forecast.soil_moisture_0_to_1cm || []);

  const threshold    = FROST_THRESHOLDS[cropType] ?? 28;
  const next48Temps  = temps.slice(0, 48);
  const next7dPrecip = precip.slice(0, 168);

  const minTemp48h       = next48Temps.length ? Math.min(...next48Temps) : 50;
  const frostDegreeHours = next48Temps.filter(t => t < threshold).length;
  const precip7dayIn     = next7dPrecip.reduce((a, b) => a + (b || 0), 0);
  const avgHumidity      = humidity.slice(0, 48).reduce((a, b) => a + (b || 0), 0) / 48;
  const avgWind          = wind.slice(0, 48).reduce((a, b) => a + (b || 0), 0) / 48;
  const avgSoilTemp      = soilTemp.slice(0, 48).reduce((a, b) => a + (b || 0), 0) / 48;
  const avgSoilMoist     = soilMoist.slice(0, 48).reduce((a, b) => a + (b || 0), 0) / 48;
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
    // Graceful fallback — stub so the rest of the app still works
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
