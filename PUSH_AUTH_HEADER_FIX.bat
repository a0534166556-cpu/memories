@echo off
echo Fixing Authorization header forwarding in Netlify Function...
git add netlify/functions/api.js

echo Committing...
git commit -m "Fix: Forward Authorization header through Netlify Function proxy"

echo Pushing to GitHub...
git push

echo Done! Netlify will rebuild in 2-3 minutes.
pause
