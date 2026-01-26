@echo off
echo ========================================
echo Pushing ALL edit page fixes
echo ========================================
echo.
echo This will push:
echo - EditMemorial endpoint fix (optionalAuth + logging)
echo - MemorialPage error handling (503 errors)
echo - QR code fixes (always use Netlify URL)
echo - Netlify redirects improvements
echo.
cd /d "%~dp0"

echo Step 1: Adding all modified files...
git add backend/server.js frontend/src/pages/MemorialPage.jsx frontend/src/pages/EditMemorial.jsx netlify.toml

echo.
echo Step 2: Checking status...
git status --short

echo.
echo Step 3: Committing all changes...
git commit -m "Fix: Complete edit page fixes - optionalAuth for GET endpoint, better 503 error handling, QR code improvements"

echo.
echo Step 4: Pushing to GitHub...
git push

echo.
echo ========================================
echo ✅ DONE! All fixes pushed
echo ========================================
echo.
echo Changes pushed:
echo ✅ EditMemorial endpoint - now works with authentication
echo ✅ Error handling - friendly messages for 503 errors
echo ✅ QR codes - always use Netlify URL
echo ✅ Netlify redirects - improved configuration
echo.
echo Next steps:
echo 1. Wait 2-3 minutes for Railway and Netlify to rebuild
echo 2. Make sure MySQL service is ONLINE in Railway
echo 3. Try editing a memorial page - it should work now!
echo.
pause
