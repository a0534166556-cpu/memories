@echo off
echo Updating Tehilim selector to show only available chapters...
git add frontend/src/pages/CreateMemorial.jsx

echo Committing...
git commit -m "Update: Show only available Tehilim chapters (with full text) instead of all 150"

echo Pushing to GitHub...
git push

echo.
echo Done! Now only chapters with full text will be shown.
pause
