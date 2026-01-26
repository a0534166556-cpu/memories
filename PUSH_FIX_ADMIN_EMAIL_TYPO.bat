@echo off
cd /d "%~dp0"
echo Fixing admin email typo: gmal.com -> gmail.com...
git add backend/server.js frontend/src/pages/ManageMemorials.jsx
git commit -m "Fix: Correct admin email from gmal.com to gmail.com"
git push
echo Done! Now admin check should work correctly.
pause
