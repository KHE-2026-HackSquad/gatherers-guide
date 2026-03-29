"""
train_model.py
Trains XGBoost crop loss model from features.csv and saves shaman_xgb.pkl.
Run once: python src/train_model.py
"""

import pandas as pd
import numpy as np
from xgboost import XGBClassifier
from sklearn.model_selection import train_test_split
from sklearn.metrics import roc_auc_score, classification_report
import pickle
import json
import os

FEATURES_CSV = os.path.join(os.path.dirname(__file__), "../data/features.csv")
MODEL_PATH   = os.path.join(os.path.dirname(__file__), "../models/shaman_xgb.pkl")
META_PATH    = os.path.join(os.path.dirname(__file__), "../models/model_meta.json")

FEATURE_NAMES = [
    "frost_degree_hours",
    "min_temp",
    "precip_7day",
    "avg_humidity",
    "avg_wind",
    "avg_soil_temp",
    "soil_saturation",
    "day_of_year",
]

def main():
    print("Loading features.csv...")
    df = pd.read_csv(FEATURES_CSV, header=None)

    # First column = label, rest = features
    X = df.iloc[:, 1:].values
    y = df.iloc[:, 0].values

    print(f"  {len(df):,} rows, {X.shape[1]} features")
    print(f"  Crop loss rate: {y.mean():.1%}")

    # ── Train / test split ─────────────────────────────────────────────────
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42, stratify=y
    )

    # ── Train XGBoost ──────────────────────────────────────────────────────
    print("\nTraining XGBoost model...")
    model = XGBClassifier(
        objective     = "binary:logistic",
        n_estimators  = 100,
        max_depth     = 5,
        learning_rate = 0.2,
        subsample     = 0.8,
        eval_metric   = "auc",
        random_state  = 42,
        verbosity     = 0,
    )

    model.fit(
        X_train, y_train,
        eval_set = [(X_test, y_test)],
        verbose  = 10,
    )

    # ── Evaluate ───────────────────────────────────────────────────────────
    y_pred  = model.predict(X_test)
    y_proba = model.predict_proba(X_test)[:, 1]
    auc     = roc_auc_score(y_test, y_proba)

    print(f"\nAUC Score: {auc:.4f}")
    print(classification_report(y_test, y_pred, target_names=["Safe", "Crop Loss"]))

    # ── Feature importance ─────────────────────────────────────────────────
    importance = dict(zip(FEATURE_NAMES, model.feature_importances_.tolist()))
    print("Feature importance:")
    for k, v in sorted(importance.items(), key=lambda x: -x[1]):
        print(f"  {k:<28} {v:.4f}")

    # ── Save model + metadata ──────────────────────────────────────────────
    os.makedirs(os.path.dirname(MODEL_PATH), exist_ok=True)

    with open(MODEL_PATH, "wb") as f:
        pickle.dump(model, f)

    meta = {
        "auc":              round(auc, 4),
        "feature_names":    FEATURE_NAMES,
        "feature_importance": importance,
        "n_estimators":     100,
        "trained_on_rows":  len(df),
        "crop_loss_rate":   round(float(y.mean()), 4),
    }
    with open(META_PATH, "w") as f:
        json.dump(meta, f, indent=2)

    print(f"\nModel saved  → {MODEL_PATH}")
    print(f"Metadata     → {META_PATH}")
    print("Run 'python src/model_server.py' to serve predictions.")

if __name__ == "__main__":
    main()
