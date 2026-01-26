@echo off
echo ========================================
echo Fix: Users Can Manage Their Own Temporary Memorials
echo ========================================
echo.
echo This will allow regular users to:
echo - See their temporary memorials in manage page
echo - Edit their temporary memorials (even if created before login)
echo - Delete their temporary memorials
echo - Only see their own memorials (not others)
echo.
cd /d "%~dp0"

git add backend/server.js frontend/src/pages/ManageMemorials.jsx frontend/src/pages/EditMemorial.jsx frontend/src/pages/CreateMemorial.jsx
git commit -m "Fix: Allow users to manage their own temporary memorials - edit/delete/view only their own, auto-link temporary memorials to account"
git push

echo.
echo ========================================
echo ✅ DONE!
echo ========================================
echo.
echo Now regular users can:
echo ✅ See all their memorials (including temporary ones created before login)
echo ✅ Edit their own memorials only
echo ✅ Delete their own memorials only
echo ✅ Temporary memorials auto-link to user account
echo ✅ Only see their own memorials (not others)
echo.
echo IMPORTANT: Make sure MySQL service is ONLINE in Railway!
echo.
pause
