@echo off
SETLOCAL ENABLEDELAYEDEXPANSION

echo.
echo ==========================================
echo  The Gatherer's Guide — First-Time Setup
echo ==========================================
echo.

:: ── Check dependencies ───────────────────────────────
where docker >nul 2>nul
IF %ERRORLEVEL% NEQ 0 (
  echo [ERROR] docker is not installed. Install Docker Desktop: https://www.docker.com/products/docker-desktop
  exit /b 1
)
echo [OK] docker found

where node >nul 2>nul
IF %ERRORLEVEL% NEQ 0 (
  echo [ERROR] node is not installed. Install Node.js: https://nodejs.org
  exit /b 1
)
echo [OK] node found

where python >nul 2>nul
IF %ERRORLEVEL% NEQ 0 (
  echo [ERROR] python is not installed. Install Python: https://www.python.org/downloads
  exit /b 1
)
echo [OK] python found

echo.
echo [1/4] Installing ML pipeline Node deps...
cd shaman-ml-pipeline
call npm install
cd ..

echo.
echo [2/4] Installing Python deps...
cd shaman-ml-pipeline
pip install -r requirements.txt >nul
cd ..

echo.
echo [3/4] Fetching weather archive (2015-2026)...
echo       This may take a few minutes...
cd shaman-ml-pipeline
node src\fetchData.mjs
cd ..

echo.
echo [4/4] Engineering features + training XGBoost model...
cd shaman-ml-pipeline
python src\feature_engineering.py
python src\train_model.py
cd ..

echo.
echo ==========================================
echo  Setup complete! Starting all services...
echo ==========================================
echo.
echo  Frontend : http://localhost:5173
echo  API      : http://localhost:3000
echo  Model    : http://localhost:5001
echo.

docker compose up --build

ENDLOCAL
pause