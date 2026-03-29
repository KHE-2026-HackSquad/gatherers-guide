# The Gatherer's Guide

A full-stack agricultural decision tool for Portage County, Ohio. It combines a 10-year historical weather archive, an XGBoost crop loss model, a live forecast API, and a React dashboard to give farmers and gardeners a real-time read on planting conditions.

Built for KHE 2026 · Data Science Track.

---

## How It Works

```
Open-Meteo Archive (2015–2026)
        ↓
  fetchData.mjs          → data/portage_county_weather_2015_2026.csv
        ↓
  feature_engineering.py → data/features.csv
        ↓
  train_model.py         → models/shaman_xgb.pkl
        ↓
  model_server.py        → Flask API on :5001  (serves /predict)
        ↓
  shaman-core-api        → Express API on :3000 (fetches live forecast + calls model)
        ↓
  shaman-ui              → React app on :5173  (dashboard)
```

The ML pipeline is a one-time setup. Once the model is trained and saved, Docker Compose starts all three services together and the app is live.

---

## Project Structure

```
gatherers-guide/
├── docker-compose.yml
├── shaman-ml-pipeline/       # Python ML pipeline + Flask model server
│   └── src/
│       ├── fetchData.mjs         # Fetches 10yr weather archive from Open-Meteo
│       ├── feature_engineering.py # Converts raw CSV → features.csv
│       ├── train_model.py         # Trains XGBoost → shaman_xgb.pkl
│       └── model_server.py        # Flask API serving predictions on :5001
├── shaman-core-api/          # Node.js/Express backend
│   └── src/
│       ├── server.js
│       ├── services/
│       │   ├── nwsOracle.js      # Fetches live 7-day forecast from Open-Meteo
│       │   └── modelClient.js    # Builds feature vector + calls Flask model
│       └── routes/
│           ├── omens.js          # GET /omens — crop risk + shaman omen text
│           └── forecast.js       # GET /forecast — hourly data for charts
└── shaman-ui/                # React + Vite + Tailwind frontend
    └── src/
        ├── components/           # OmenFeed, RiskTimeline, PlantingCalendar, etc.
        ├── hooks/useWeather.js   # Polls the API and manages state
        └── services/api.js       # Axios calls to shaman-core-api
```

---

## Prerequisites

- [Docker Desktop](https://www.docker.com/products/docker-desktop/) (includes Docker Compose)
- Node.js 18+ and Python 3.10+ (only needed for the one-time ML pipeline setup)

---

## Setup & Running

### Step 1 — Train the model (one time only)

The model must be trained before Docker Compose can start the model server.

**1a. Fetch the historical weather archive**

```bash
cd shaman-ml-pipeline
npm install
node src/fetchData.mjs
```

This calls the Open-Meteo archive API and saves ~96,000 hourly rows (2015–2026) to `data/portage_county_weather_2015_2026.csv`. Takes about 30 seconds.

**1b. Engineer features**

```bash
pip install -r requirements.txt
python src/feature_engineering.py
```

Aggregates hourly data into daily rows and computes derived features (frost degree hours, 7-day precip, soil saturation index, etc.). Outputs `data/features.csv`.

**1c. Train the XGBoost model**

```bash
python src/train_model.py
```

Trains a binary classifier (crop loss: yes/no) and saves `models/shaman_xgb.pkl` and `models/model_meta.json`. Prints AUC score and feature importances on completion.

---

### Step 2 — Start everything with Docker Compose

From the repo root:

```bash
docker compose up --build
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

To stop and tear down:

```bash
docker compose down
```

This starts three containers:

| Container | Port | Description |
|---|---|---|
| `shaman-model` | 5001 | Flask model server (XGBoost predictions) |
| `shaman-api` | 3000 | Express API (live forecast + omen generation) |
| `shaman-ui` | 5173 | React dashboard |

---

## API Reference

### `GET /omens?crop=<type>`

Returns a crop risk prediction and a generated omen message.

Supported crop types: `corn`, `soybean`, `wheat`, `tomato`, `strawberry`

```json
{
  "omen": {
    "level": "CAUTION",
    "icon": "🌤️",
    "message": "The omens are mixed. Planting score: 72/100..."
  },
  "frostRisk": "LOW",
  "prediction": {
    "cropLossProbability": 0.28,
    "plantingScore": 72,
    "recommendedWaitDays": 1,
    "confidence": 0.85,
    "source": "xgboost",
    "features": { ... }
  },
  "meta": {
    "crop": "corn",
    "minTemp48h": 38.4,
    "fetchedAt": "2026-03-29T14:00:00.000Z"
  }
}
```

### `GET /forecast`

Returns 168 hours (7 days) of hourly forecast data starting from the current hour, plus calculated spray windows.

```json
{
  "hourly": [
    {
      "time": "2026-03-29T14:00:00.000Z",
      "temperature": 52.3,
      "precipitation": 0.0,
      "humidity": 65,
      "windSpeed": 7.2,
      "soilTemp": 44.1,
      ...
    }
  ],
  "sprayWindows": ["2026-03-29T16:00:00.000Z", ...],
  "fetchedAt": "2026-03-29T14:00:00.000Z"
}
```

Spray windows are hours where wind < 10 mph, humidity is 40–90%, and no precipitation.

### `GET /health`

Returns `{ "status": "ok" }` — useful for container health checks.

---

## ML Model Details

The model is an XGBoost binary classifier trained on 10 years of Portage County, OH weather data.

**Features (8 total):**

| Feature | Description |
|---|---|
| `frost_degree_hours` | Hours below crop-specific frost threshold |
| `min_temp` | Minimum temperature (°F) in next 48h |
| `precip_7day_in` | 7-day accumulated precipitation (inches) |
| `avg_humidity` | Average relative humidity (%) |
| `avg_wind_speed` | Average wind speed (mph) |
| `avg_soil_temp` | Average soil temperature at surface (°F) |
| `soil_saturation_index` | Soil moisture normalized 0–1 |
| `day_of_year` | Seasonality signal |

**Crop-specific frost thresholds:**

| Crop | Threshold |
|---|---|
| Strawberry | 32°F |
| Tomato | 33°F |
| Soybean | 30°F |
| Corn | 28°F |
| Wheat | 24°F |

The model server falls back to a rule-based stub if the Flask server is unreachable, so the UI always returns a result. The `source` field in the response indicates whether the prediction came from `xgboost` or `stub`.

---

## Development

To run services individually without Docker:

**ML model server**
```bash
cd shaman-ml-pipeline
python src/model_server.py
```

**Core API**
```bash
cd shaman-core-api
npm install
npm run dev   # uses nodemon for hot reload
```

**UI**
```bash
cd shaman-ui
npm install
npm run dev
```

When running outside Docker, set `MODEL_SERVER_URL=http://localhost:5001/predict` as an environment variable for the core API.

---

## Data Sources

- [Open-Meteo](https://open-meteo.com/) — free, no API key required, used for both the historical archive and live 7-day forecast
- Location: Kent, Ohio (Portage County) — lat 41.1537, lon -81.3579
