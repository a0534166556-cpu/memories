@echo off
echo ========================================
echo Improving error handling for clients
echo ========================================
echo.
cd /d "%~dp0"

git add frontend/src/pages/MemorialPage.jsx
git commit -m "Improve: Better error handling for 503/502 errors - show friendly message to clients when server is down"
git push

echo.
echo ========================================
echo ✅ DONE!
echo ========================================
echo.
echo Now when Railway is down (503), clients will see:
echo - Friendly error message in Hebrew
echo - Explanation that server is temporarily unavailable
echo - Refresh button to try again
echo.
pause
