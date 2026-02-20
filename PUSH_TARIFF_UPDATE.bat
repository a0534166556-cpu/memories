@echo off
chcp 65001 >nul
cd /d "%~dp0"

echo Adding files...
git add frontend/src/pages/SaveMemorial.jsx frontend/src/pages/Pricing.jsx frontend/src/pages/CreateMemorial.jsx frontend/src/pages/EditMemorial.jsx 2>nul
git add -A
echo.
echo Committing...
git commit -m "Tariff, 7GB, AddStorage, סדר תפילות לאזכרה, תיקון טעינת תמונות (Cloudinary/API URL)"
echo.
echo Pushing...
git push
echo.
echo Done.
pause
