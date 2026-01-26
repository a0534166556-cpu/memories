@echo off
echo ========================================
echo Pushing ALL fixes for edit and view pages
echo ========================================
echo.
echo This will push:
echo - EditMemorial error handling (404/410/503)
echo - MemorialPage error handling (410 expired, QR code errors)
echo - Backend GET endpoint fix (optionalAuth)
echo - QR code improvements
echo.
cd /d "%~dp0"

echo Step 1: Adding all modified files...
git add backend/server.js frontend/src/pages/EditMemorial.jsx frontend/src/pages/MemorialPage.jsx

echo.
echo Step 2: Checking status...
git status --short

echo.
echo Step 3: Committing all changes...
git commit -m "Fix: Complete error handling for edit and view pages - 404/410/503 errors, QR code errors, better user messages"

echo.
echo Step 4: Pushing to GitHub...
git push

echo.
echo ========================================
echo ✅ DONE! All fixes pushed
echo ========================================
echo.
echo Changes pushed:
echo ✅ EditMemorial - better error handling for all error types
echo ✅ MemorialPage - better 410/404 error messages  
echo ✅ Backend GET endpoint - optionalAuth support
echo ✅ QR code error handling improvements
echo.
echo IMPORTANT: Make sure MySQL service is ONLINE in Railway!
echo.
echo Next steps:
echo 1. Wait 2-3 minutes for Railway and Netlify to rebuild
echo 2. Make sure MySQL service is ONLINE
echo 3. Try editing/viewing memorial pages - should work now!
echo.
pause
