@echo off
SETLOCAL ENABLEDELAYEDEXPANSION

:: Lock in the root directory — wherever setup.bat lives
SET ROOT=%~dp0
SET ROOT=%ROOT:~0,-1%

echo.
echo ==========================================
echo  The Gatherer's Guide - First-Time Setup
echo ==========================================
echo.
echo Root directory: %ROOT%
echo.

:: ── Check dependencies ───────────────────────────────────────────────────────
where docker >nul 2>nul
IF %ERRORLEVEL% NEQ 0 (
  echo [ERROR] Docker not found. Install: https://www.docker.com/products/docker-desktop
  pause & exit /b 1
)
echo [OK] docker found

where node >nul 2>nul
IF %ERRORLEVEL% NEQ 0 (
  echo [ERROR] Node.js not found. Install: https://nodejs.org
  pause & exit /b 1
)
echo [OK] node found

where python >nul 2>nul
IF %ERRORLEVEL% NEQ 0 (
  echo [ERROR] Python not found. Install: https://www.python.org/downloads
  pause & exit /b 1
)
echo [OK] python found

:: ── Verify subfolders exist ───────────────────────────────────────────────────
IF NOT EXIST "%ROOT%\shaman-ml-pipeline" (
  echo [ERROR] shaman-ml-pipeline folder not found.
  echo         Make sure you extracted the zip correctly.
  echo         Expected: %ROOT%\shaman-ml-pipeline
  pause & exit /b 1
)
echo [OK] shaman-ml-pipeline found

IF NOT EXIST "%ROOT%\shaman-core-api" (
  echo [ERROR] shaman-core-api folder not found.
  pause & exit /b 1
)
echo [OK] shaman-core-api found

IF NOT EXIST "%ROOT%\shaman-ui" (
  echo [ERROR] shaman-ui folder not found.
  pause & exit /b 1
)
echo [OK] shaman-ui found

IF NOT EXIST "%ROOT%\docker-compose.yml" (
  echo [ERROR] docker-compose.yml not found.
  pause & exit /b 1
)
echo [OK] docker-compose.yml found

:: ── Step 1: npm install ───────────────────────────────────────────────────────
echo.
echo [1/4] Installing ML pipeline Node deps...
cd /d "%ROOT%\shaman-ml-pipeline"
call npm install
IF %ERRORLEVEL% NEQ 0 ( echo [ERROR] npm install failed. & pause & exit /b 1 )
cd /d "%ROOT%"

:: ── Step 2: pip install ───────────────────────────────────────────────────────
echo.
echo [2/4] Installing Python deps...
cd /d "%ROOT%\shaman-ml-pipeline"
pip install -r requirements.txt
IF %ERRORLEVEL% NEQ 0 ( echo [ERROR] pip install failed. & pause & exit /b 1 )
cd /d "%ROOT%"

:: ── Step 3: fetch weather archive ────────────────────────────────────────────
echo.
echo [3/4] Fetching weather archive (2015-2026)...
echo       This may take a few minutes...
cd /d "%ROOT%\shaman-ml-pipeline"
node src\fetchData.mjs
IF %ERRORLEVEL% NEQ 0 ( echo [ERROR] fetchData.mjs failed. & pause & exit /b 1 )
cd /d "%ROOT%"

:: ── Step 4: feature engineering + model training ─────────────────────────────
echo.
echo [4/4] Engineering features and training XGBoost model...
cd /d "%ROOT%\shaman-ml-pipeline"
python src\feature_engineering.py
IF %ERRORLEVEL% NEQ 0 ( echo [ERROR] feature_engineering.py failed. & pause & exit /b 1 )
python src\train_model.py
IF %ERRORLEVEL% NEQ 0 ( echo [ERROR] train_model.py failed. & pause & exit /b 1 )
cd /d "%ROOT%"

:: ── Start Docker ──────────────────────────────────────────────────────────────
echo.
echo ==========================================
echo  Setup complete! Starting all services...
echo ==========================================
echo.
echo  Frontend : http://localhost:5173
echo  API      : http://localhost:3000
echo  Model    : http://localhost:5001
echo.

cd /d "%ROOT%"
docker compose up --build

ENDLOCAL
pause