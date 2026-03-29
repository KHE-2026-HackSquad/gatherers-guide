// services/omens.js
// Synchronizes the Shaman's voice with the XGBoost model's reality

const getOmen = (prediction, cropType) => {
  const risk = Math.round(prediction.cropLossProbability * 100);
  const minTemp = prediction.features.min_temp;
  const frostHours = prediction.features.frost_degree_hours;

  // 1. DANGER: High Risk or Active Freeze
  if (risk > 70 || (minTemp <= 32 && frostHours > 0)) {
    return {
      level: "DANGER",
      icon: "FREEZE", 
      message: `CRITICAL ALERT: THE FROST-SPIRIT AND THE FLOOD-SPIRIT WALK TOGETHER. CROP LOSS PROBABILITY STANDS AT ${risk}%. DELAY ALL PLANTING FOR ${prediction.recommendedWaitDays} SUN-CYCLES.`
    };
  }

  // 2. WARNING: Moderate Risk or Chilly Temperatures
  if (risk > 25 || minTemp < 40) {
    return {
      level: "WARNING",
      icon: "COLD",
      message: `CAUTION ADVISED: THE COLD SPIRIT LINGERS AT THE FIELD'S EDGE. TEMPERATURES ARE PREDICTED TO APPROACH THE SACRED THRESHOLD. PROTECT VULNERABLE SPROUTS.`
    };
  }

  // 3. SAFE: Favorable conditions
  return {
    level: "SAFE",
    icon: "GROW",
    message: `STABLE CONDITIONS: THE LAND IS AT PEACE. FAVORABLE GROWTH PATTERNS DETECTED FOR ${cropType.toUpperCase()}. PROCEED WITH PLANNED AGRICULTURAL CYCLES.`
  };
};

module.exports = { getOmen };