@echo off
cd /d "%~dp0"
echo Restricting delete feature to admin only (a0534166556@gmal.com)...
git add backend/server.js frontend/src/pages/ManageMemorials.jsx
git commit -m "Security: Restrict delete memorials to admin only (a0534166556@gmal.com)"
git push
echo Done! Only admin can delete memorials now.
pause
