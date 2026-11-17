@echo off
echo ============================================================
echo   AURUM PROCURE: JEWELLERY PROCUREMENT ANALYTICS PLATFORM
echo ============================================================
echo Starting Backend API and Vite React Frontend...

start "Aurum Procure - Backend API" cmd /c "%~dp0run_backend.bat"
timeout /t 3 /nobreak >nul
start "Aurum Procure - Frontend Web Dashboard" cmd /c "%~dp0run_frontend.bat"

echo.
echo Application initialized!
echo  - Frontend Dashboard: http://localhost:5173
echo  - Backend API:        http://localhost:5000
echo  - Health Check:       http://localhost:5000/api/health
echo ============================================================
