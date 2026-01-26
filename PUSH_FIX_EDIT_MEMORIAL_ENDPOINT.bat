@echo off
echo ========================================
echo Fix: Edit Memorial Endpoint
echo ========================================
echo.
cd /d "%~dp0"

git add backend/server.js
git commit -m "Fix: Add optionalAuth to GET memorials/:id endpoint and improve logging for debugging edit issues"
git push

echo.
echo ========================================
echo ✅ DONE!
echo ========================================
echo.
echo After Railway redeploys (2-3 min):
echo - Check Railway logs to see what's happening
echo - Try editing a memorial again
echo.
pause
