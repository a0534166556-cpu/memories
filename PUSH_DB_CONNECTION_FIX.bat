@echo off
echo Pushing DB connection / login fixes...
echo.

cd /d "%~dp0"

echo Adding all changes...
git add -A

echo.
echo Creating commit...
git commit -m "Improve MySQL connection handling and login stability"

echo.
echo Pushing to GitHub...
git push

echo.
echo Done!
pause

