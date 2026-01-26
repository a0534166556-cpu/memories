@echo off
echo ========================================
echo Push: Local MySQL Setup Files
echo ========================================
echo.
echo This will add:
echo - .env.example file with local MySQL config
echo - SETUP_LOCAL_MYSQL.md with setup instructions
echo - setup-local-db.bat and .sh scripts
echo - Better logging for local development
echo.
cd /d "%~dp0"

git add backend/env.example.txt backend/SETUP_LOCAL_MYSQL.md backend/setup-local-db.bat backend/setup-local-db.sh backend/server.js
git commit -m "Add: Local MySQL setup files and instructions - allows running app locally with MySQL"
git push

echo.
echo ========================================
echo ✅ DONE!
echo ========================================
echo.
echo Now developers can:
echo ✅ Run the app locally with MySQL
echo ✅ Use .env.example as template
echo ✅ Follow SETUP_LOCAL_MYSQL.md for setup
echo ✅ Use setup-local-db scripts for quick setup
echo.
pause
