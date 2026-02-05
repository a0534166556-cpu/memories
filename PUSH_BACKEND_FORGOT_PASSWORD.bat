@echo off
chcp 65001 >nul
cd /d "%~dp0"
echo Adding backend (server.js and related)...
git add backend/server.js
git status
echo.
echo Commit and push backend so Railway gets forgot-password route...
git commit -m "Backend: forgot-password and reset-password routes for Railway"
git push origin main
echo.
echo Done. Wait for Railway to redeploy, then test Forgot Password.
pause
