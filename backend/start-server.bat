@echo off
echo Starting backend server...
echo.
echo Make sure you're in the backend directory!
echo.
cd /d "%~dp0"
npm run dev
pause
