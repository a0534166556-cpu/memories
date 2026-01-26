@echo off
cd /d "%~dp0"
echo Adding debug logs for admin check...
git add backend/server.js frontend/src/pages/ManageMemorials.jsx
git commit -m "Debug: Add console logs for admin check to diagnose delete button issue"
git push
echo Done! Check browser console and server logs for admin status.
pause
