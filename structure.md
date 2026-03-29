gatherers-guide/
├── docker-compose.yml          ✅ one command starts all 3 services
├── .gitignore                  ✅ ignores node_modules, .env, CSVs, .pkl
│
├── shaman-ml-pipeline/
│   ├── Dockerfile              ✅
│   ├── requirements.txt        ✅
│   ├── package.json            ✅ type:module for fetchData.mjs
│   └── src/
│       ├── fetchData.mjs       ✅ archive CSV generator
│       ├── feature_engineering.py ✅ CSV → features.csv
│       ├── train_model.py      ✅ XGBoost trainer → shaman_xgb.pkl
│       └── model_server.py     ✅ Flask prediction API on :5001
│
├── shaman-core-api/
│   ├── Dockerfile              ✅
│   ├── package.json            ✅ CommonJS
│   └── src/
│       ├── server.js           ✅
│       ├── services/
│       │   ├── nwsOracle.js    ✅ live forecast
│       │   └── modelClient.js  ✅ calls Flask, stub fallback
│       └── routes/
│           ├── omens.js        ✅ Shaman omen generation
│           └── forecast.js     ✅ hourly data for charts
│
└── shaman-ui/
    ├── Dockerfile              ✅
    └── package.json            ✅ React + Chart.js + Tailwind