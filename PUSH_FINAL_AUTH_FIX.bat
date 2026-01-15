@echo off
echo Final fix for Authorization header...
git add netlify/functions/api.js

echo Committing...
git commit -m "Fix: Forward ALL headers including Authorization to Railway backend"

echo Pushing to GitHub...
git push

echo Done! Netlify will rebuild in 2-3 minutes.
pause
