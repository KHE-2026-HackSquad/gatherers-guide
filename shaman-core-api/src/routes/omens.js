// routes/omens.js
const express = require("express");
const router = express.Router();
const { getForecast } = require("../services/nwsOracle");
const { getPrediction } = require("../services/modelClient");

/**
 * SHAMANIC LOGIC ENGINE
 * Determines the professional alert level and message based on ML prediction
 */
const determineOmen = (prediction, cropType) => {
  const risk = Math.round(prediction.cropLossProbability * 100);
  const minTemp = prediction.features.min_temp;
  const frostHours = prediction.features.frost_degree_hours;

  // DANGER: High Risk or Active Freeze
  if (risk > 70 || (minTemp <= 32 && frostHours > 0)) {
    return {
      level: "DANGER",
      icon: "FREEZE", 
      message: `CRITICAL ALERT: THE FROST-SPIRIT AND THE FLOOD-SPIRIT WALK TOGETHER. CROP LOSS PROBABILITY STANDS AT ${risk}%. DELAY ALL PLANTING FOR ${prediction.recommendedWaitDays} SUN-CYCLES.`
    };
  }

  // WARNING: Moderate Risk or Chilly Temperatures
  if (risk > 25 || minTemp < 40) {
    return {
      level: "WARNING",
      icon: "COLD",
      message: `CAUTION ADVISED: THE COLD SPIRIT LINGERS AT THE FIELD'S EDGE. TEMPERATURES ARE PREDICTED TO APPROACH THE SACRED THRESHOLD. PROTECT VULNERABLE SPROUTS.`
    };
  }

  // SAFE: Favorable conditions
  return {
    level: "SAFE",
    icon: "GROW",
    message: `STABLE CONDITIONS: THE LAND IS AT PEACE. FAVORABLE GROWTH PATTERNS DETECTED FOR ${cropType.toUpperCase()}. PROCEED WITH PLANNED AGRICULTURAL CYCLES.`
  };
};

/**
 * API ENDPOINT: GET /omens/:crop
 */
router.get("/:crop", async (req, res) => {
  try {
    const { crop } = req.params;
    const forecast = await getForecast();
    
    // 1. Get ML features and XGBoost prediction
    const prediction = await getPrediction(forecast, crop);
    
    // 2. Determine the text message using the logic above
    const omen = determineOmen(prediction, crop);

    // 3. Return combined data
    res.json({
      ...prediction,
      omen
    });
  } catch (err) {
    console.error("[omens route error]", err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;