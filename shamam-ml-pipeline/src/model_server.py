"""
model_server.py
Flask server that serves XGBoost crop loss predictions.
Started automatically by Docker Compose.
"""

from flask import Flask, request, jsonify
import pickle
import json
import numpy as np
import os

app = Flask(__name__)

BASE     = os.path.dirname(__file__)
MODEL_PATH = os.path.join(BASE, "../models/shaman_xgb.pkl")
META_PATH  = os.path.join(BASE, "../models/model_meta.json")

# ── Load model once on startup ─────────────────────────────────────────────
if not os.path.exists(MODEL_PATH):
    raise FileNotFoundError(
        f"No model found at {MODEL_PATH}. "
        "Run: docker compose run shaman-model python src/train_model.py"
    )

with open(MODEL_PATH, "rb") as f:
    MODEL = pickle.load(f)

with open(META_PATH, "r") as f:
    META = json.load(f)

FEATURE_NAMES = META["feature_names"]
print(f"Shaman model loaded — AUC: {META['auc']} — Features: {len(FEATURE_NAMES)}")

# ── Routes ─────────────────────────────────────────────────────────────────
@app.route("/health", methods=["GET"])
def health():
    return jsonify({
        "status":   "The Shaman is awake",
        "auc":      META["auc"],
        "features": len(FEATURE_NAMES),
    })

@app.route("/predict", methods=["POST"])
def predict():
    try:
        body     = request.get_json(force=True)
        features = body.get("features", {})

        # Build feature vector in correct order
        vector = np.array([[
            float(features.get("frost_degree_hours",   0)),
            float(features.get("min_temp",             50)),
            float(features.get("precip_7day_in",        0)),
            float(features.get("avg_humidity",         60)),
            float(features.get("avg_wind_speed",        5)),
            float(features.get("avg_soil_temp",        50)),
            float(features.get("soil_saturation_index", 0.3)),
            float(features.get("day_of_year",          180)),
        ]])

        prob  = float(MODEL.predict_proba(vector)[0][1])
        label = int(MODEL.predict(vector)[0])

        return jsonify({
            "predictions": [{
                "score":      round(prob, 4),
                "label":      label,
                "confidence": round(max(prob, 1 - prob), 4),
            }]
        })

    except Exception as e:
        return jsonify({ "error": str(e) }), 500

@app.route("/model-info", methods=["GET"])
def model_info():
    return jsonify(META)

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5001, debug=False)
