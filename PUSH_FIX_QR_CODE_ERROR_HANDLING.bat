@echo off
cd /d "%~dp0"
echo Adding error handling for QR code image loading...
git add frontend/src/pages/MemorialPage.jsx
git commit -m "Add: Error handling and user-friendly message when QR code fails to load"
git push
echo Done! Users will now see a helpful message if QR code doesn't load.
pause
