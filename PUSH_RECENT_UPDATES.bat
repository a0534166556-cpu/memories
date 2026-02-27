@echo off
chcp 65001 >nul
cd /d "%~dp0"

echo Adding all changes...
git add -A

echo Committing...
git commit -m "Share, print, a11y on memorial; Home what-on-memorial section; Delete all memorials + cleanup fix; Font size 3 levels + localStorage" || echo No changes or already committed.

echo Pushing to origin...
git push

echo.
echo Done.
pause
