@echo off
cd /d "%~dp0"
echo Fixing EditMemorial form and image paths...
git add frontend/src/pages/EditMemorial.jsx
git commit -m "Fix: Complete EditMemorial form JSX and fix image path 404 errors"
git push
echo Done! EditMemorial page is now fully functional.
pause
