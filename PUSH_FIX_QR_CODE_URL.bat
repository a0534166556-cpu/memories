@echo off
cd /d "%~dp0"
echo Fixing QR code URL generation to always use Netlify URL...
git add backend/server.js
git commit -m "Fix: Ensure QR codes always point to Netlify URL, not Railway"
git push
echo Done! QR codes will now point to the correct Netlify URL.
echo.
echo NOTE: Old QR codes in database still have wrong URLs. You may need to regenerate them or update BASE_URL in Railway.
pause
