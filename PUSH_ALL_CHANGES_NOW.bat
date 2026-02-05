@echo off
chcp 65001 >nul
echo Adding all changes...
git add -A

echo.
echo Committing...
git commit -m "PEPK/Play signing docs, run-pepk script, CreateMemorial reminder section and styles" || echo No changes to commit or already committed.

echo.
echo Pushing to GitHub...
git push

echo.
echo Done.
pause
