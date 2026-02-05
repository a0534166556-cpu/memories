@echo off
cd /d "%~dp0"
echo Freeing port 8080...
echo.

for /f "tokens=5" %%a in ('netstat -ano ^| findstr :8080 ^| findstr LISTENING') do (
  echo Killing PID %%a
  taskkill /PID %%a /F
  goto done
)
echo No process found on port 8080.
:done
echo.
echo Done. You can now run: npm run dev
pause
