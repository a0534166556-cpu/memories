@echo off
echo Pushing more Tehilim chapters and Mishnayot...
git add frontend/src/data/tehilim.js frontend/src/data/mishnayot.js frontend/src/pages/CreateMemorial.jsx

echo Committing...
git commit -m "Add: More popular Tehilim (20, 30, 34, 67, 92, 104, 145) and Mishnayot (ברכות ג-ד, אבות ד-ה)"

echo Pushing to GitHub...
git push

echo.
echo Done! More chapters and mishnayot added.
pause
