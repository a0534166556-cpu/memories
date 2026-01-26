@echo off
cd /d "%~dp0"
echo Adding better admin debugging...
git add backend/server.js frontend/src/pages/ManageMemorials.jsx
git commit -m "Debug: Improve admin check debugging with console logs"
git push
echo Done! Check browser console (F12) for admin status debug info.
pause
