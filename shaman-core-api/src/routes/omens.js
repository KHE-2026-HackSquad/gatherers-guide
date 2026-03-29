// routes/omens.js
const express       = require("express");
const router        = express.Router();
const { getForecast }   = require("../services/nwsOracle");
const { getPrediction } = require("../services/modelClient");

// ── Shaman omen language ──────────────────────────────────────────────────
function generateOmen(prediction, frostRisk) {
  const { cropLossProbability: prob, recommendedWaitDays: wait, plantingScore } = prediction;

  if (frostRisk === "HIGH" && prob > 0.6) {
    return {
      level:   "DANGER",
      icon:    "🔥",
      message: `The frost-spirit and the flood-spirit walk together. Crop loss probability stands at ${Math.round(prob * 100)}%. Wait ${wait} sun-cycle${wait !== 1 ? "s" : ""} before you plant.`,
    };
  }
  if (frostRisk === "HIGH") {
    return {
      level:   "WARNING",
      icon:    "❄️",
      message: `The cold spirit lingers at the field's edge. Temperatures will fall below the sacred threshold. Cover what you have planted. Do not begin new sowing.`,
    };
  }
  if (prob > 0.6) {
    return {
      level:   "WARNING",
      icon:    "⚠️",
      message: `The soil speaks unrest — ${Math.round(prob * 100)}% probability of crop loss if you plant today. The Shaman reads ${wait} sun-cycle${wait !== 1 ? "s" : ""} of patience before the land is ready.`,
    };
  }
  if (prob > 0.3) {
    return {
      level:   "CAUTION",
      icon:    "🌤️",
      message: `The omens are mixed. Planting score: ${plantingScore}/100. Proceed with caution — watch the night temperatures closely.`,
    };
  }
  return {
    level:   "SAFE",
    icon:    "🌱",
    message: `The land sleeps peacefully. Planting score: ${plantingScore}/100. The spirits favor the Gatherer who plants within the next ${wait === 0 ? "3" : wait} sun-cycles.`,
  };
}

// ── GET /omens ────────────────────────────────────────────────────────────
router.get("/", async (req, res) => {
  try {
    const cropType = (req.query.crop || "corn").toLowerCase().trim();
    const forecast = await getForecast();

    // temperature_2m is a Float32Array — convert to plain array first
    const allTemps  = Array.from(forecast.temperature_2m || []);
    const next48    = allTemps.slice(0, 48);
    const frostRisk = next48.some(t => t <= 36) ? "HIGH" : "LOW";
    const minTemp   = next48.length ? Math.min(...next48).toFixed(1) : "N/A";

    const prediction = await getPrediction(forecast, cropType);
    const omen       = generateOmen(prediction, frostRisk);

    res.json({
      omen,
      frostRisk,
      prediction,
      meta: {
        crop:       cropType,
        minTemp48h: parseFloat(minTemp),
        fetchedAt:  new Date().toISOString(),
        source:     prediction.source,
      },
    });

  } catch (err) {
    console.error("[omens]", err);
    res.status(500).json({ error: "Shaman failed to divine", detail: err.message });
  }
});

module.exports = router;
