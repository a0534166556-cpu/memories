@echo off
echo ========================================
echo CRITICAL FIX: QR Code URL Generation
echo ========================================
echo.
echo This will fix QR codes to ALWAYS include /memorial/[id] path
echo.
cd /d "%~dp0"

git add backend/server.js
git commit -m "CRITICAL FIX: Ensure QR codes always include /memorial/[id] path with validation"
git push

echo.
echo ========================================
echo ✅ DONE! Changes pushed
echo ========================================
echo.
echo IMPORTANT: 
echo 1. Wait 2-3 minutes for Railway to redeploy
echo 2. Create a NEW memorial page
echo 3. The QR code should now point to /memorial/[id]
echo.
pause
