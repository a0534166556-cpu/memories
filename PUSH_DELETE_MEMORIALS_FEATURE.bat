@echo off
cd /d "%~dp0"
echo Adding delete memorials feature...
git add backend/server.js frontend/src/pages/ManageMemorials.jsx
git commit -m "Add: Delete memorials feature + cleanup old test memorials endpoint"
git push
echo Done! Now you can delete memorials and clean up old test ones.
pause
