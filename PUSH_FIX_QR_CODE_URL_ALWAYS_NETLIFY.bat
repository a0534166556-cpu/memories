@echo off
cd /d "%~dp0"
echo Fixing QR code generation to ALWAYS use Netlify URL, never Railway URL...
git add backend/server.js
git commit -m "Fix: Ensure QR codes ALWAYS use Netlify URL, never Railway URL - check multiple sources and validate"
git push
echo Done! QR codes will now always point to the correct Netlify URL.
echo.
echo IMPORTANT: Existing QR codes still have old URLs. Regenerate them using the button.
pause
