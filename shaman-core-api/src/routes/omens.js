// routes/omens.js
const express = require("express");
const router = express.Router();
const { getForecast } = require("../services/nwsOracle");
const { getPrediction } = require("../services/modelClient");
const { getOmen } = require("../services/omens");

router.get("/:crop", async (req, res) => {
  try {
    const { crop } = req.params;
    const forecast = await getForecast();
    
    // 1. Get the ML prediction based on 48h future data
    const prediction = await getPrediction(forecast, crop);
    
    // 2. Get the professional text omen based on that prediction
    const omen = getOmen(prediction, crop);

    // 3. Send the unified data back to the UI
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