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

# ── Load model once on startup (degraded mode if missing) ─────────────────
def load_model_and_meta():
    if not os.path.exists(MODEL_PATH) or not os.path.exists(META_PATH):
        print(
            "No trained model found. Start in degraded mode and train with: "
            "docker compose run shaman-model python src/train_model.py"
        )
        return None, {
            "auc": None,
            "feature_names": [],
            "feature_importance": {},
            "model_loaded": False,
            "message": "Model not trained yet",
        }

    with open(MODEL_PATH, "rb") as f:
        model = pickle.load(f)

    with open(META_PATH, "r") as f:
        meta = json.load(f)

    meta["model_loaded"] = True
    print(f"Shaman model loaded — AUC: {meta['auc']} — Features: {len(meta['feature_names'])}")
    return model, meta


MODEL, META = load_model_and_meta()
FEATURE_NAMES = META.get("feature_names", [])

# ── Routes ─────────────────────────────────────────────────────────────────
@app.route("/health", methods=["GET"])
def health():
    return jsonify({
        "status":   "The Shaman is awake" if MODEL is not None else "Model not trained",
        "auc":      META.get("auc"),
        "features": len(FEATURE_NAMES),
        "modelLoaded": MODEL is not None,
    })

@app.route("/predict", methods=["POST"])
def predict():
    try:
        if MODEL is None:
            return jsonify({
                "error": "Model not trained",
                "hint": "Run: docker compose run shaman-model python src/train_model.py",
            }), 503

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
    return jsonify({
        **META,
        "modelLoaded": MODEL is not None,
    })


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5001, debug=False)

