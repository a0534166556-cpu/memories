@echo off
chcp 65001 >nul
cd /d "%~dp0"

echo Adding files...
git add -A

echo.
echo Committing...
git commit -m "Fix: add Authorization header to delete test memorials cleanup"

echo.
echo Pushing...
git push

echo.
echo Done.
pause
