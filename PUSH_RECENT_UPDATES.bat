@echo off
chcp 65001 >nul
cd /d "%~dp0"

echo Adding all changes...
git add -A

echo Committing...
git commit -m "Hide payment in app (in_app=1): ManageMemorials + AddStorage for Google Play compliance" || echo No changes or already committed.

echo Pushing to origin...
git push

echo.
echo Done.
pause
