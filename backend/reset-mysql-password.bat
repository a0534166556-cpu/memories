@echo off
echo Copying init file...
copy /Y "%~dp0mysql-reset-init.txt" "C:\Users\a0534\mysql-init.txt"
if errorlevel 1 (
  echo ERROR: Could not copy file. Run this from backend folder or check path.
  pause
  exit /b 1
)
echo Init file copied. Running MySQL with init file...
echo Wait about 15 seconds, then press Ctrl+C to stop.
echo.
"C:\Program Files\MySQL\MySQL Server 8.0\bin\mysqld.exe" --datadir="C:\ProgramData\MySQL\MySQL Server 8.0\Data" --init-file=C:\Users\a0534\mysql-init.txt
pause
