@echo off
echo Starting Aurum Procure Backend API on Port 5000...
cd /d "%~dp0backend"
node src/server.js
pause
