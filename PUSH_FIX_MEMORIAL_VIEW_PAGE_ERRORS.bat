@echo off
echo ========================================
echo Fix: Memorial View Page Error Handling
echo ========================================
echo.
echo This will improve error handling for:
echo - 410 errors (expired memorials)
echo - 404 errors (missing files)
echo - Better QR code error messages
echo.
cd /d "%~dp0"

git add frontend/src/pages/MemorialPage.jsx
git commit -m "Fix: Improve error handling on memorial view page - better 410/404 messages, QR code error handling"
git push

echo.
echo ========================================
echo ✅ DONE!
echo ========================================
echo.
echo Now the memorial view page will show:
echo - Clear messages for expired memorials (410)
echo - Helpful messages for missing files (404)
echo - Better QR code error handling
echo.
pause
