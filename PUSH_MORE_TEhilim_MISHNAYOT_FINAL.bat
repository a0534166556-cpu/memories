@echo off
echo Adding more popular Tehilim chapters and Mishnayot...
git add frontend/src/data/tehilim.js frontend/src/data/mishnayot.js

echo Committing...
git commit -m "Add more popular Tehilim chapters (33, 17, 37, 84, 113, 146) and Mishnayot (ברכות ה-ז, כלים כד, מקוואות ז, אבות ו)"

echo Pushing to GitHub...
git push

echo.
echo Done! Added 6 more Tehilim chapters and 6 more Mishnayot.
pause
