@echo off
echo Pushing location feature and all fixes to GitHub...
echo.

cd /d "%~dp0"

echo Adding all changes...
git add -A

echo.
echo Creating commit...
git commit -m "Add location feature for graves - cemetery name, address, GPS coordinates, age calculation, mishnayot in example page, and fix ManageMemorials grantingId bug"

echo.
echo Pushing to GitHub...
git push

echo.
echo Done!
pause
