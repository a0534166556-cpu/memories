@echo off
echo ========================================
echo Pushing ALL Today's Fixes
echo ========================================
echo.
echo This will push ALL changes made today:
echo.
echo 1. Edit Page Error Handling:
echo    - Better 404/410/503 error messages
echo    - User-friendly error display with actions
echo.
echo 2. View Page Error Handling:
echo    - Better 410 expired memorial messages
echo    - QR code error handling improvements
echo    - Better user feedback for all errors
echo.
echo 3. Manage Page - Temporary Memorials:
echo    - Show temporary memorials in manage page
echo    - Save memorial IDs to localStorage
echo    - Auto-link temporary memorials to account
echo    - Allow edit/view/delete for temporary memorials
echo.
echo 4. Backend Improvements:
echo    - Endpoint to link memorials to user account
echo    - Better permissions (users can edit/delete own)
echo    - Support for localStorage IDs in API
echo    - Auto-link temporary memorials
echo.
echo 5. Local MySQL Setup:
echo    - env.example.txt template
echo    - SETUP_LOCAL_MYSQL.md guide
echo    - setup-local-db scripts
echo    - Better database logging
echo.
cd /d "%~dp0"

echo.
echo Step 1: Adding all modified files...
git add backend/server.js
git add backend/package.json
git add frontend/src/pages/EditMemorial.jsx
git add frontend/src/pages/MemorialPage.jsx
git add frontend/src/pages/ManageMemorials.jsx
git add frontend/src/pages/CreateMemorial.jsx
git add backend/env.example.txt
git add backend/SETUP_LOCAL_MYSQL.md
git add backend/FIX_LOCAL_ENV_NOT_LOADING.md
git add backend/QUICK_FIX_LOCAL_LOGIN_ERROR.md
git add backend/setup-local-db.bat
git add backend/setup-local-db.sh

echo.
echo Step 2: Checking status...
git status --short

echo.
echo Step 3: Committing all changes...
git commit -m "Complete fixes: Edit/View error handling, temporary memorials, local MySQL setup, reduce logging

- EditMemorial: Better 404/410/503 error messages with user actions
- MemorialPage: Better error handling for expired memorials and QR codes
- ManageMemorials: Show temporary memorials, save IDs to localStorage, auto-link to account
- Backend: Link memorials endpoint, better permissions, localStorage ID support
- Local MySQL: Setup files and documentation for local development
- Fix: Add dotenv to load .env file in local development only
- Fix: Reduce logging in production - only log in development mode"

echo.
echo Step 4: Pushing to GitHub...
git push

echo.
echo ========================================
echo ✅ DONE! All fixes pushed
echo ========================================
echo.
echo All changes include:
echo ✅ Edit page - better error handling
echo ✅ View page - better error messages
echo ✅ Manage page - temporary memorials support
echo ✅ Backend - permissions and linking improvements
echo ✅ Local MySQL - setup files and docs
echo.
echo IMPORTANT: Make sure MySQL service is ONLINE in Railway!
echo.
echo Next steps:
echo 1. Wait 2-3 minutes for Railway and Netlify to rebuild
echo 2. Make sure MySQL service is ONLINE in Railway
echo 3. Test all features - should work now!
echo.
pause
