@echo off
cd /d "%~dp0"
echo Fixing Netlify Function to handle /api/memorials/user/my path correctly...
git add netlify/functions/api.js
git commit -m "Fix: Improve path extraction in Netlify Function for nested API paths like /api/memorials/user/my"
git push
echo Done! The fix should resolve the 404 error.
pause
