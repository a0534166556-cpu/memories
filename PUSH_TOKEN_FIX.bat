@echo off
echo Fixing token handling in SaveMemorial and Login...
git add frontend/src/pages/SaveMemorial.jsx frontend/src/pages/Login.jsx

echo Committing...
git commit -m "Fix: Improve token handling - check token before payment, better error messages"

echo Pushing to GitHub...
git push

echo Done! Netlify will rebuild in 2-3 minutes.
pause
