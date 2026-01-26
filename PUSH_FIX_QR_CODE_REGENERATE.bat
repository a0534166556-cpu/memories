@echo off
cd /d "%~dp0"
echo Adding QR code regeneration feature for fixing old QR codes...
git add backend/server.js frontend/src/pages/MemorialPage.jsx
git commit -m "Add: QR code regeneration endpoint and button for fixing old QR codes with wrong URLs"
git push
echo Done! Users can now regenerate QR codes if they point to wrong URLs.
echo.
echo IMPORTANT: Make sure BASE_URL is set in Railway environment variables!
pause
