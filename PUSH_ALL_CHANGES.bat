@echo off
echo Adding all changes...
git add frontend/src/pages/ManageMemorials.jsx
git add frontend/src/data/tehilim.js
git add frontend/src/data/mishnayot.js
git add frontend/src/pages/CreateMemorial.jsx

echo Committing all changes...
git commit -m "Add ManageMemorials page + more Tehilim and Mishnayot + update selectors to show only available chapters"

echo Pushing to GitHub...
git push

echo.
echo Done! All changes have been pushed.
pause
