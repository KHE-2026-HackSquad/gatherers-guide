"""
feature_engineering.py
Converts raw Open-Meteo hourly archive CSV → daily features.csv for XGBoost.
Run once: python src/feature_engineering.py
"""

import pandas as pd
import numpy as np
import os

RAW_CSV     = os.path.join(os.path.dirname(__file__), "../data/portage_county_weather_2015_2026.csv")
OUTPUT_CSV  = os.path.join(os.path.dirname(__file__), "../data/features.csv")

def main():
    print("Loading raw archive CSV...")
    df = pd.read_csv(RAW_CSV)
    print(f"  {len(df):,} hourly rows loaded")

    # ── Aggregate hourly → daily ───────────────────────────────────────────
    daily = df.groupby("date").agg(
        min_temp            = ("temperature_2m",          "min"),
        max_temp            = ("temperature_2m",          "max"),
        avg_temp            = ("temperature_2m",          "mean"),
        precip_sum          = ("precipitation",           "sum"),
        avg_humidity        = ("relative_humidity_2m",    "mean"),
        avg_wind            = ("wind_speed_10m",          "mean"),
        max_wind_gust       = ("wind_gusts_10m",          "max"),
        avg_soil_temp       = ("soil_temperature_0_to_7cm",  "mean"),
        avg_soil_moist      = ("soil_moisture_0_to_7cm",     "mean"),
        total_snowfall      = ("snowfall",                "sum"),
    ).reset_index()

    # ── Engineered features ────────────────────────────────────────────────
    # Rolling 7-day precipitation
    daily["precip_7day"] = daily["precip_sum"].rolling(7, min_periods=1).sum()

    # Frost degree hours proxy (degrees below 32°F × 1 day)
    daily["frost_degree_hours"] = np.where(
        daily["min_temp"] < 32, 32 - daily["min_temp"], 0
    )

    # Soil saturation index 0–1
    daily["soil_saturation"] = (daily["avg_soil_moist"] / 0.5).clip(0, 1)

    # Day of year (seasonality signal)
    daily["day_of_year"] = pd.to_datetime(daily["date"]).dt.dayofyear

    # ── Simulated crop loss label ──────────────────────────────────────────
    # 1 = loss risk, 0 = safe
    # Based on agronomic thresholds for Portage County, OH
    daily["crop_loss"] = (
        (daily["min_temp"]           < 32)   |  # frost
        (daily["frost_degree_hours"] >  4)   |  # sustained freeze
        (daily["precip_7day"]        >  4.0) |  # waterlogged
        (daily["soil_saturation"]    >  0.85)|  # saturated soil
        (daily["max_wind_gust"]      > 35)      # damaging winds
    ).astype(int)

    print(f"  Daily rows: {len(daily):,}")
    print(f"  Crop loss rate: {daily['crop_loss'].mean():.1%}")

    # ── Final feature columns ─────────────────────────────────────────────
    feature_cols = [
        "frost_degree_hours",
        "min_temp",
        "precip_7day",
        "avg_humidity",
        "avg_wind",
        "avg_soil_temp",
        "soil_saturation",
        "day_of_year",
    ]

    # SageMaker / XGBoost format: label FIRST, no header
    output = daily[["crop_loss"] + feature_cols].dropna()
    output.to_csv(OUTPUT_CSV, index=False, header=False)

    print(f"\nSaved {len(output):,} rows → {OUTPUT_CSV}")
    print(f"Columns: crop_loss, {', '.join(feature_cols)}")

if __name__ == "__main__":
    main()
