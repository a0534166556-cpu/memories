@echo off
echo Updating Mishnayot selector to show only available Mishnayot...
git add frontend/src/pages/CreateMemorial.jsx

echo Committing...
git commit -m "Update: Show only available Mishnayot (with full text) instead of all tractates"

echo Pushing to GitHub...
git push

echo.
echo Done! Now only Mishnayot with full text will be shown.
pause
