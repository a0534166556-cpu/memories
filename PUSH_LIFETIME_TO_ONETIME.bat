@echo off
chcp 65001 >nul
cd /d "%~dp0"
echo Adding all changes...
git add -A
echo Committing...
git commit -m "Change lifetime to one-time: הנצחה לכל החיים -> חד פעמי/חד פעמית across site; MySQL reset script improvements"
echo Pushing to GitHub...
git push
echo.
echo Done! All changes have been pushed.
pause
