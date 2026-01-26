@echo off
cd /d "%~dp0"
echo Improving admin check with email normalization...
git add backend/server.js frontend/src/pages/ManageMemorials.jsx
git commit -m "Fix: Normalize email comparison for admin check (case-insensitive)"
git push
echo Done! Admin check now works with normalized emails.
pause
