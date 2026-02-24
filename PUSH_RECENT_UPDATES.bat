@echo off
chcp 65001 >nul
cd /d "%~dp0"

echo Adding all changes...
git add -A

echo Committing...
git commit -m "Google Play + maintenance + expiry: in_app=1 hide payment (ManageMemorials, AddStorage); maintenance 2yr then yearly; 410 block expired no delete; grant-lifetime 2yr; Privacy/Pricing wording; addOneMonth fix" || echo No changes or already committed.

echo Pushing to origin...
git push

echo.
echo Done.
pause
