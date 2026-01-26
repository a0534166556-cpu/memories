@echo off
echo ========================================
echo Pushing ALL QR code and image fixes
echo ========================================
echo.
cd /d "%~dp0"

echo Step 1: Checking what needs to be pushed...
git status --short

echo.
echo Step 2: Adding all modified files...
git add backend/server.js netlify.toml frontend/src/pages/MemorialPage.jsx

echo.
echo Step 3: Committing...
git commit -m "Fix: QR codes always use Netlify URL + improve redirects + error handling"

echo.
echo Step 4: Pushing to GitHub...
git push

echo.
echo ========================================
echo ✅ DONE! Changes pushed successfully
echo ========================================
echo.
echo Next steps:
echo 1. Wait 2-3 minutes for Netlify to rebuild
echo 2. Check if images load correctly
echo 3. Create new QR code (or regenerate existing one)
echo 4. Test scanning the QR code - it should work now!
echo.
pause
