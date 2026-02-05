@echo off
cd /d "%~dp0"
set MYSQL_EXE=
if exist "C:\Program Files\MySQL\MySQL Server 8.4\bin\mysql.exe" set MYSQL_EXE=C:\Program Files\MySQL\MySQL Server 8.4\bin\mysql.exe
if exist "C:\Program Files\MySQL\MySQL Server 8.0\bin\mysql.exe" set MYSQL_EXE=C:\Program Files\MySQL\MySQL Server 8.0\bin\mysql.exe
if exist "C:\Program Files\MySQL\MySQL Server 5.7\bin\mysql.exe" set MYSQL_EXE=C:\Program Files\MySQL\MySQL Server 5.7\bin\mysql.exe
if "%MYSQL_EXE%"=="" set MYSQL_EXE=mysql

echo Creating MySQL database "memorial"...
echo.
"%MYSQL_EXE%" -u root -pMemorialLocal123 -e "CREATE DATABASE IF NOT EXISTS memorial;"
if errorlevel 1 goto fail
echo.
echo OK - Database "memorial" is ready. Run: npm run dev
goto end
:fail
echo.
echo Failed. If mysql not in PATH, edit create-database.bat and set MYSQL_EXE to your mysql.exe path.
:end
echo.
pause
