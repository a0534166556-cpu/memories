@echo off
cd /d "%~dp0"
git add -A
git commit -m "Add ManageMemorials page + more Tehilim chapters (33,17,37,84,113,146) and Mishnayot (ברכות ה-ז, כלים כד, מקוואות ז, אבות ו) + update selectors to show only available chapters"
git push
echo Done!
pause
