@echo off
echo Starting frontend server...
echo.
echo Make sure you're in the frontend directory!
echo.
cd /d "%~dp0"
npm run dev
pause
