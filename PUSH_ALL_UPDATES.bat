@echo off
echo ========================================
echo Pushing all updates to GitHub...
echo ========================================
echo.

echo Step 1: Adding all changes...
git add -A

echo.
echo Step 2: Committing changes...
git commit -m "Update: Add popular Tehilim chapters (16,32,41,49,72,103,150) + External links in readers + Change button text + Update PWA version to 1.0.1"

echo.
echo Step 3: Pushing to repository...
git push

echo.
echo ========================================
echo Done! 
echo ========================================
echo.
echo Next steps:
echo 1. Wait 2-3 minutes for Netlify to rebuild
echo 2. Clear browser cache (Ctrl+Shift+Delete) or use Incognito
echo 3. Hard refresh: Ctrl+F5 or Ctrl+Shift+R
echo.
pause
