@echo off
cd /d "%~dp0"
echo Pushing ALL fixes for QR codes and images...
echo.
echo This will push:
echo - QR code URL fix (always use Netlify URL)
echo - Netlify redirects configuration
echo - QR code error handling
echo.
git add backend/server.js netlify.toml frontend/src/pages/MemorialPage.jsx
git status
echo.
echo Committing changes...
git commit -m "Fix: Complete QR code and image loading fixes - always use Netlify URL, improve redirects"
echo.
echo Pushing to GitHub...
git push
echo.
echo Done! Netlify will automatically rebuild with these changes.
echo.
echo IMPORTANT: After Netlify rebuilds (2-3 minutes):
echo 1. Check if images load correctly
echo 2. Create a new QR code using the regenerate button
echo 3. Test scanning the new QR code
pause
