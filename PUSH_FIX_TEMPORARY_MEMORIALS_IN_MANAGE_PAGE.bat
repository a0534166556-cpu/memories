@echo off
echo ========================================
echo Fix: Show Temporary Memorials in Manage Page
echo ========================================
echo.
echo This will fix:
echo - Save memorial IDs to localStorage when creating
echo - Link temporary memorials to user account automatically
echo - Show temporary memorials in manage page even if created before login
echo - Allow edit/view/delete for temporary memorials
echo.
cd /d "%~dp0"

git add frontend/src/pages/CreateMemorial.jsx frontend/src/pages/ManageMemorials.jsx backend/server.js
git commit -m "Fix: Show temporary memorials in manage page - save IDs to localStorage, link to account automatically, allow edit/view/delete"
git push

echo.
echo ========================================
echo ✅ DONE!
echo ========================================
echo.
echo Now temporary memorials will:
echo ✅ Appear in manage page even if created before login
echo ✅ Be linked to user account automatically
echo ✅ Allow edit/view/delete operations
echo ✅ Persist across logout/login sessions
echo.
pause
