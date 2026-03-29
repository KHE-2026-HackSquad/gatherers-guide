// routes/omens.js
const express       = require("express");
const router        = express.Router();
const { getForecast }   = require("../services/nwsOracle");
const { getPrediction } = require("../services/modelClient");

// ── Shaman omen language ──────────────────────────────────────────────────
function generateOmen(prediction, frostRisk, cropType) {
  const { cropLossProbability: prob, recommendedWaitDays: wait, plantingScore } = prediction;
  const cropLabel = cropType.charAt(0).toUpperCase() + cropType.slice(1);

  if (frostRisk === "HIGH" && prob > 0.6) {
    return {
      level:   "DANGER",
      icon:    "🔥",
      message: `The frost-spirit and the flood-spirit walk together. ${cropLabel} faces a ${Math.round(prob * 100)}% chance of loss. Do not plant — wait ${wait} sun-cycle${wait !== 1 ? "s" : ""} for the land to recover.`,
    };
  }
  if (frostRisk === "HIGH") {
    return {
      level:   "WARNING",
      icon:    "❄️",
      message: `The cold spirit will cross the sacred threshold for ${cropLabel} in the next 48 hours. Protect what is already in the ground. Hold off on new planting until temperatures rise.`,
    };
  }
  if (prob > 0.6) {
    return {
      level:   "WARNING",
      icon:    "⚠️",
      message: `The soil speaks unrest — ${Math.round(prob * 100)}% probability of ${cropLabel} loss if you plant today. The Shaman reads ${wait} sun-cycle${wait !== 1 ? "s" : ""} of patience before the land is ready.`,
    };
  }
  if (prob > 0.3) {
    return {
      level:   "CAUTION",
      icon:    "🌤️",
      message: `The omens are mixed for ${cropLabel}. Planting score: ${plantingScore}/100. Proceed with caution — watch the night temperatures closely over the next 48 hours.`,
    };
  }
  return {
    level:   "SAFE",
    icon:    "🌱",
    message: `The land is at peace. Conditions favor ${cropLabel} — planting score ${plantingScore}/100. ${wait === 0 ? "The spirits say: plant now." : `Plant within the next ${wait} sun-cycle${wait !== 1 ? "s" : ""}.`}`,
  };
}

// Crop-specific frost thresholds (must match modelClient.js)
const FROST_THRESHOLDS = {
  strawberry: 32,
  tomato:     33,
  soybean:    30,
  corn:       28,
  wheat:      24,
};

// ── GET /omens ────────────────────────────────────────────────────────────
router.get("/", async (req, res) => {
  try {
    const cropType = (req.query.crop || "corn").toLowerCase().trim();
    const forecast = await getForecast();

    // Filter to future hours only before evaluating frost risk
    const now = new Date();
    now.setMinutes(0, 0, 0, 0);

    const allTimes  = Array.from(forecast.time || []);
    const allTemps  = Array.from(forecast.temperature_2m || []);

    // Pair times with temps, filter to future, take next 48h
    const futureTemps = allTimes
      .map((t, i) => ({ t: new Date(t), temp: allTemps[i] }))
      .filter(d => d.t >= now)
      .slice(0, 48)
      .map(d => d.temp);

    const cropThreshold = FROST_THRESHOLDS[cropType] ?? 28;
    const frostRisk = futureTemps.some(t => t <= cropThreshold) ? "HIGH" : "LOW";
    const minTemp   = futureTemps.length ? Math.min(...futureTemps).toFixed(1) : "N/A";

    const prediction = await getPrediction(forecast, cropType);
    const omen       = generateOmen(prediction, frostRisk, cropType);

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
