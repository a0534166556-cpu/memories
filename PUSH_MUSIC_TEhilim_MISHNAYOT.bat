@echo off
echo Pushing music, tehilim and mishnayot updates...
git add frontend/src/data/tehilim.js frontend/src/data/mishnayot.js frontend/src/pages/CreateMemorial.jsx

echo Committing...
git commit -m "Add: More popular Tehilim chapters (27, 51, 95, 100, 142, 143) and Mishnayot + Music files instructions"

echo Pushing to GitHub...
git push

echo.
echo Note: Don't forget to copy the music files!
echo Run: COPY_MUSIC_FILES.bat
echo.
pause
