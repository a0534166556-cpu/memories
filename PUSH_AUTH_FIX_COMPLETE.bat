@echo off
echo Fixing Authorization header forwarding - complete version...
git add netlify/functions/api.js frontend/src/pages/SaveMemorial.jsx frontend/src/pages/Login.jsx frontend/src/pages/MemorialPage.jsx frontend/src/pages/MemorialPage.css backend/server.js

echo Committing...
git commit -m "Fix: Complete Authorization header forwarding + Remove Short Messages + Improve token handling"

echo Pushing to GitHub...
git push

echo Done! Netlify will rebuild in 2-3 minutes.
echo After rebuild, check Netlify Function logs to see if Authorization header is received.
pause
