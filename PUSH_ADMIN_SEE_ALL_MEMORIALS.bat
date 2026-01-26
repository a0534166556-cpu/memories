@echo off
cd /d "%~dp0"
echo Updating ManageMemorials to show all memorials for admin...
git add backend/server.js frontend/src/pages/ManageMemorials.jsx
git commit -m "Feature: Admin can see all memorials (including old test ones) in ManageMemorials page"
git push
echo Done! Admin will now see all memorials including old test ones.
pause
