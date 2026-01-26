@echo off
echo ========================================
echo Fix: Edit Page Error Handling
echo ========================================
echo.
echo This will improve error handling for:
echo - 404 errors (memorial not found)
echo - 410 errors (expired memorials)
echo - 503 errors (server unavailable)
echo - Better user messages
echo.
cd /d "%~dp0"

git add frontend/src/pages/EditMemorial.jsx
git commit -m "Fix: Improve error handling on edit page - better 404/410/503 messages with helpful actions"
git push

echo.
echo ========================================
echo ✅ DONE!
echo ========================================
echo.
echo Now the edit page will show:
echo - Clear messages for different error types
echo - Helpful suggestions for each error
echo - Action buttons to fix issues
echo.
pause
