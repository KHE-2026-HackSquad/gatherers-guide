// services/modelClient.js
const MODEL_URL = process.env.MODEL_SERVER_URL || "http://localhost:5001/predict";

const FROST_THRESHOLDS = {
  strawberry: 32, tomato: 33, soybean: 30, corn: 28, wheat: 24,
};

function buildFeatureVector(forecast, cropType = "corn") {
  const now = new Date();
  now.setMinutes(0, 0, 0, 0);

  // Filter for the NEXT 48 HOURS only to synchronize all data points
  const combined = (forecast.time || []).map((t, i) => ({
    time: new Date(t),
    temp: forecast.temperature_2m?.[i] ?? 50,
    precip: forecast.precipitation?.[i] ?? 0,
    humid: forecast.relative_humidity_2m?.[i] ?? 60,
    wind: forecast.wind_speed_10m?.[i] ?? 5,
    soilTemp: forecast.soil_temperature_0cm?.[i] ?? 50,
    soilMoist: forecast.soil_moisture_0_to_1cm?.[i] ?? 0.3
  })).filter(d => d.time >= now);

  const next48 = combined.slice(0, 48);
  const next7d = combined.slice(0, 168);
  const threshold = FROST_THRESHOLDS[cropType] ?? 28;

  const temps = next48.map(d => d.temp);
  const minTemp48h = temps.length ? Math.min(...temps) : 50;
  const frostHours = temps.filter(t => t < threshold).length;

  return {
    frost_degree_hours: parseFloat(frostHours.toFixed(2)),
    min_temp: parseFloat(minTemp48h.toFixed(2)),
    precip_7day_in: parseFloat(next7d.reduce((a, b) => a + b.precip, 0).toFixed(4)),
    avg_humidity: parseFloat((next48.reduce((a, b) => a + b.humid, 0) / (next48.length || 1)).toFixed(2)),
    avg_wind_speed: parseFloat((next48.reduce((a, b) => a + b.wind, 0) / (next48.length || 1)).toFixed(2)),
    avg_soil_temp: parseFloat((next48.reduce((a, b) => a + b.soilTemp, 0) / (next48.length || 1)).toFixed(2)),
    soil_saturation_index: parseFloat(Math.min((next48.reduce((a, b) => a + b.soilMoist, 0) / (next48.length || 1)) / 0.5, 1.0).toFixed(4)),
    day_of_year: Math.ceil((Date.now() - new Date(new Date().getFullYear(), 0, 0)) / 86400000)
  };
}

async function getPrediction(forecast, cropType = "corn") {
  const features = buildFeatureVector(forecast, cropType);
  try {
    const res = await fetch(MODEL_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ features }),
    });
    const result = await res.json();
    const score = result?.predictions?.[0]?.score ?? 0.1;

    return {
      cropLossProbability: parseFloat(score.toFixed(2)),
      plantingScore: Math.max(0, Math.round(100 - score * 100)),
      recommendedWaitDays: score > 0.6 ? 3 : score > 0.3 ? 1 : 0,
      confidence: result?.predictions?.[0]?.confidence ?? 0.85,
      source: "xgboost",
      features,
    };
  } catch (err) {
    return stubPrediction(features);
  }
}

function stubPrediction(features) {
  let prob = 0.05;
  if (features.frost_degree_hours > 0) prob += 0.40;
  if (features.min_temp < 35) prob += 0.20;
  prob = Math.min(prob, 0.99);
  return {
    cropLossProbability: prob,
    plantingScore: Math.round(100 - prob * 100),
    recommendedWaitDays: prob > 0.5 ? 2 : 0,
    confidence: 0,
    source: "stub",
    features
  };
}

module.exports = { getPrediction };