@echo off
echo Testing MySQL connection...
echo.

REM Try with password prompt
echo Attempting connection with password...
mysql -u root -p -e "SELECT 'Connection successful!' AS status;" 2>nul
if %errorlevel% == 0 (
    echo.
    echo ✅ MySQL connection works WITH password!
    echo Please add your password to .env file: MYSQL_PASSWORD=your_password
    pause
    exit /b 0
)

echo.
echo Trying without password...
mysql -u root -e "SELECT 'Connection successful!' AS status;" 2>nul
if %errorlevel% == 0 (
    echo.
    echo ✅ MySQL connection works WITHOUT password!
    echo Your .env file should have: MYSQL_PASSWORD=
    echo (empty password)
    pause
    exit /b 0
)

echo.
echo ❌ Could not connect to MySQL
echo.
echo Possible issues:
echo 1. MySQL is not running
echo 2. MySQL is not in PATH
echo 3. Wrong username/password
echo.
echo To check if MySQL is running:
echo   - Open Services (Win+R, type: services.msc)
echo   - Look for MySQL service
echo.
pause
